import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Interview() {
  return (
    <LessonLayout
      title="System Design Interviews"
      sectionId="systemdesign"
      lessonIndex={6}
      prev={{ path: '/systemdesign/messaging', label: 'Message Queues &amp; Streaming' }}
      next={null}
    >
      <p>
        This is the capstone lesson. Everything you have learned about databases, caching,
        load balancing, distributed systems, and message queues comes together here. System
        design interviews test your ability to synthesize these building blocks into coherent,
        scalable architectures — and to communicate your thinking clearly under pressure.
      </p>

      {/* ===== Section 1: The Interview Framework ===== */}
      <h2>The Interview Framework</h2>

      <p>
        System design interviews are less about finding the &quot;correct&quot; answer and more about
        demonstrating how you think through complex problems. Every successful candidate
        follows a structured approach. Master this four-step framework and you will walk
        into any interview with confidence.
      </p>

      <FlowChart chart={"graph TD\nA[1. Clarify Requirements - 5 min] --> B[2. High-Level Design - 10-15 min]\nB --> C[3. Deep Dive - 15-20 min]\nC --> D[4. Wrap-up and Bottlenecks - 5 min]"} />

      <h3>Step 1: Clarify Requirements (5 minutes)</h3>
      <p>
        Never start designing immediately. Spend the first five minutes asking questions to
        narrow the scope. Identify functional requirements (what the system does) and
        non-functional requirements (scale, latency, availability). Write these down so
        both you and the interviewer are aligned.
      </p>
      <ul>
        <li>Who are the users? How many daily active users?</li>
        <li>What are the core features we need to support?</li>
        <li>What are the scale requirements (QPS, storage, bandwidth)?</li>
        <li>What are the latency and availability requirements?</li>
        <li>Is the system read-heavy, write-heavy, or balanced?</li>
        <li>Are there any specific consistency requirements?</li>
      </ul>

      <h3>Step 2: High-Level Design (10-15 minutes)</h3>
      <p>
        Sketch the major components on a whiteboard or diagram. Start with the client,
        then work through the API layer, services, data stores, and any infrastructure
        components like load balancers, caches, and queues. Do not go deep on any one
        component yet — show the overall data flow and how components interact.
      </p>

      <h3>Step 3: Deep Dive (15-20 minutes)</h3>
      <p>
        The interviewer will guide you toward specific areas of interest. This is where
        you demonstrate depth of knowledge. Common deep-dive topics include database
        schema design, caching strategy, sharding approach, API design, or handling
        edge cases. Be prepared to discuss trade-offs for every decision you make.
      </p>

      <h3>Step 4: Wrap-up (5 minutes)</h3>
      <p>
        Summarize your design. Identify potential bottlenecks and single points of failure.
        Discuss how you would monitor the system, what metrics you would track, and how
        the system would evolve as requirements change. Mention what you would improve
        if you had more time.
      </p>

      <InfoBox variant="warning" title="Most Common Mistake">
        <p>
          The number one mistake candidates make is jumping straight into designing
          components without first clarifying requirements. This leads to building the
          wrong system entirely. An interviewer who asks you to design &quot;a chat system&quot;
          might mean a Slack-like workspace tool or a WhatsApp-like mobile messenger —
          the architectures are very different. Always start by asking questions.
        </p>
      </InfoBox>

      {/* ===== Section 2: Estimation Cheat Sheet ===== */}
      <h2>Estimation Cheat Sheet</h2>

      <p>
        Back-of-the-envelope calculations show interviewers that you understand scale.
        You do not need exact numbers — order-of-magnitude estimates are sufficient.
        Memorize these reference values and use them as building blocks:
      </p>

      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Approximate Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Seconds in a day</td><td>~86,400 (round to 100K)</td></tr>
          <tr><td>1M requests/day</td><td>~12 QPS</td></tr>
          <tr><td>1B requests/day</td><td>~12,000 QPS</td></tr>
          <tr><td>1 ASCII character</td><td>1 byte</td></tr>
          <tr><td>1 average tweet or message</td><td>~200 bytes</td></tr>
          <tr><td>1 average image</td><td>~200 KB - 1 MB</td></tr>
          <tr><td>1 minute of HD video</td><td>~50 MB</td></tr>
          <tr><td>SSD random read</td><td>~100 microseconds</td></tr>
          <tr><td>HDD random read</td><td>~10 ms</td></tr>
          <tr><td>Same-datacenter round trip</td><td>~0.5 ms</td></tr>
          <tr><td>Cross-country round trip</td><td>~50 ms</td></tr>
          <tr><td>SSD sequential throughput</td><td>~1 GB/s</td></tr>
          <tr><td>Network throughput (1 Gbps link)</td><td>~125 MB/s</td></tr>
        </tbody>
      </table>

      <p>
        Use these numbers to quickly estimate QPS, storage, and bandwidth for any system.
        The formula is simple: start with users, derive actions per second, then multiply
        by data size per action. Here is a reusable template:
      </p>

      <CodeBlock language="python" code={`# Back-of-the-envelope estimation template
#
# Step 1: Daily Active Users (DAU)
# Total users:        100M
# DAU ratio:          20%
# DAU:                100M * 0.2 = 20M
#
# Step 2: Queries Per Second (QPS)
# Actions per user per day:  5
# Total daily queries:       20M * 5 = 100M
# QPS:                       100M / 100K = 1,000
# Peak QPS (2-3x average):   ~2,500
#
# Step 3: Storage (per day)
# Average record size:   500 bytes
# New records per day:   100M
# Daily storage:         100M * 500 B = 50 GB/day
# Yearly storage:        50 GB * 365  = ~18 TB/year
# With replication (3x): ~54 TB/year
#
# Step 4: Bandwidth
# Incoming: 1,000 QPS * 500 B  = 500 KB/s
# Outgoing: 1,000 QPS * 2 KB   = 2 MB/s
# Peak outgoing (3x):           ~6 MB/s`} />

      <InfoBox variant="tip" title="Round Aggressively">
        <p>
          In an interview, speed matters more than precision. Round 86,400 to 100,000.
          Round 365 to 400. Round 2.5 to 3. The interviewer wants to see that you can
          reason about scale and arrive at the right order of magnitude, not that you
          can perform long division under pressure.
        </p>
      </InfoBox>

      {/* ===== Section 3: Design - URL Shortener ===== */}
      <h2>Design: URL Shortener</h2>

      <h3>Requirements</h3>
      <ul>
        <li>
          <strong>Functional:</strong> Shorten a long URL, redirect short URL to original,
          optional custom aliases, link expiration, click analytics
        </li>
        <li>
          <strong>Non-functional:</strong> Low latency redirects (&lt; 100ms),
          high availability (99.9%), support for billions of URLs
        </li>
        <li>
          <strong>Scale:</strong> 100M URLs created/day, 10:1 read-to-write ratio
          = 1B redirects/day (~12K read QPS)
        </li>
      </ul>

      <h3>Key Design Decisions</h3>
      <p>
        <strong>Hash vs Counter:</strong> A hash-based approach (MD5 or SHA256 truncated
        to 7 characters) avoids coordination but risks collisions. A counter-based approach
        with a distributed ID generator (similar to Twitter Snowflake) produces
        guaranteed-unique, sequential IDs but requires a coordination service. The counter
        approach is usually preferred for its simplicity and collision-free guarantee.
      </p>
      <p>
        <strong>Encoding:</strong> Base62 encoding (a-z, A-Z, 0-9) with 7 characters gives
        62^7 = ~3.5 trillion unique URLs — enough for decades of growth. Avoid Base64
        because the + and / characters cause URL encoding issues.
      </p>

      <FlowChart chart={"graph TD\nClient[Client] --> AG[API Gateway]\nAG --> WS[Write Service]\nAG --> RS[Read Service]\nWS --> IDG[ID Generator - Base62]\nWS --> DB[Database]\nRS --> Cache[Redis Cache]\nCache -->|Cache Miss| DB\nWS --> Analytics[Analytics Service]\nAnalytics --> ADB[Analytics Store]"} />

      <h3>Data Model</h3>
      <p>
        The core table is straightforward: <code>short_url</code> as the primary key,
        <code>original_url</code>, <code>created_at</code>, <code>expires_at</code>,
        and <code>user_id</code>. For analytics, store click events in a separate
        append-only table with columns for <code>short_url</code>, <code>timestamp</code>,
        <code>ip_address</code>, <code>user_agent</code>, and <code>referrer</code>.
        Keep the URL table in a relational database for strong consistency. Use a
        time-series or columnar store for analytics data that is written frequently
        but only read in aggregate.
      </p>

      <h3>Scaling</h3>
      <p>
        This system is heavily read-dominant (10:1 ratio). Cache the most popular URLs
        in Redis — popular URLs follow a power-law distribution, so a relatively small
        cache will handle the vast majority of redirect requests. Shard the database by
        the hash of the short URL for even data distribution across nodes. Place a CDN
        in front of the redirect service so that repeated requests for popular short URLs
        are served from edge locations worldwide, providing single-digit millisecond latency.
      </p>

      {/* ===== Section 4: Design - Chat System ===== */}
      <h2>Design: Chat System</h2>

      <h3>Requirements</h3>
      <ul>
        <li>
          <strong>Functional:</strong> 1:1 messaging, group chat (up to 500 members),
          online/offline status indicators, message delivery receipts (sent, delivered, read)
        </li>
        <li>
          <strong>Non-functional:</strong> Real-time delivery (&lt; 200ms), message ordering
          within a conversation, message persistence, at-least-once delivery
        </li>
        <li>
          <strong>Scale:</strong> 50M DAU, average 40 messages/user/day = 2B messages/day (~23K QPS)
        </li>
      </ul>

      <h3>Key Design Decisions</h3>
      <p>
        <strong>WebSocket:</strong> HTTP polling wastes bandwidth and adds latency. Long
        polling is better but still creates overhead from repeated connection setup.
        WebSocket connections provide full-duplex, persistent communication — ideal for
        real-time chat. Each user maintains a WebSocket connection to a chat server. A
        session registry (stored in Redis) maps user IDs to the specific server instance
        they are connected to.
      </p>
      <p>
        <strong>Message Storage:</strong> Use a wide-column store like Cassandra or HBase,
        optimized for write-heavy workloads. Partition messages by <code>conversation_id</code> so
        that all messages in a conversation are co-located for efficient chat history
        retrieval. Use <code>message_id</code> (a time-based ID like Snowflake) as the sort
        key within each partition to maintain chronological order.
      </p>

      <FlowChart chart={"graph TD\nCA[Client A] --> WS1[WebSocket Server 1]\nCB[Client B] --> WS2[WebSocket Server 2]\nWS1 --> MQ[Message Queue]\nWS2 --> MQ\nMQ --> CS[Chat Service]\nCS --> MDB[Message Store]\nCS --> SR[Session Registry - Redis]\nCS --> PN[Push Notification Service]"} />

      <h3>Handling Offline Users</h3>
      <p>
        When a recipient is offline, messages are persisted in the database and a push
        notification is sent via APNs (iOS) or FCM (Android). When the user reconnects,
        the client syncs all undelivered messages using a &quot;last seen message ID&quot;
        watermark. The server returns all messages with IDs greater than the watermark,
        ensuring nothing is missed even after extended offline periods.
      </p>

      <h3>Scaling Considerations</h3>
      <p>
        Each WebSocket server can handle approximately 50K-100K concurrent connections.
        With 50M DAU, you need 500-1000 WebSocket servers behind a load balancer that
        uses consistent hashing or a dedicated connection routing service. Group messages
        require fan-out — sending a message to a 500-member group means 500 delivery
        operations. Use a message queue to handle this asynchronously so the sender is
        not blocked waiting for all deliveries to complete. For very large groups, consider
        a pub/sub pattern where each server subscribes to group channels.
      </p>

      {/* ===== Section 5: Design - News Feed ===== */}
      <h2>Design: News Feed</h2>

      <h3>Requirements</h3>
      <ul>
        <li>
          <strong>Functional:</strong> Post content (text, images, video), follow/unfollow
          users, view a personalized news feed sorted by relevance and recency
        </li>
        <li>
          <strong>Non-functional:</strong> Feed loads in &lt; 500ms, eventually consistent
          (a few seconds delay is acceptable), high availability
        </li>
        <li>
          <strong>Scale:</strong> 300M DAU, average user follows 200 people, feed checked
          10 times/day = 3B feed requests/day
        </li>
      </ul>

      <h3>Fanout on Write vs Fanout on Read</h3>
      <p>
        <strong>Fanout on Write (Push Model):</strong> When a user posts, immediately push
        the post ID into all followers&apos; feed caches. Reads become instant because the
        feed is precomputed, but writes are expensive — a user with 10K followers triggers
        10K cache update operations.
      </p>
      <p>
        <strong>Fanout on Read (Pull Model):</strong> When a user opens their feed, fetch
        the latest posts from all followed users in real time. Writes are cheap (just store
        the post) but reads are slow — following 200 users means 200 database lookups,
        merged and sorted on the fly for every feed request.
      </p>
      <p>
        <strong>Hybrid Approach — The Celebrity Problem:</strong> Users with millions of
        followers make fanout-on-write prohibitively expensive. A single celebrity post
        would trigger millions of cache writes. The solution is hybrid: use fanout-on-write
        for normal users (fewer than 10K followers) and fanout-on-read for celebrities.
        When building a feed, merge the precomputed cache entries with on-demand fetches
        of celebrity posts and pass the combined result through a ranking service.
      </p>

      <FlowChart chart={"graph TD\nUP[User Creates Post] --> PS[Post Service]\nPS --> DB[Post Database]\nPS --> FO[Fanout Service]\nFO -->|Normal Users| NFC[News Feed Cache]\nFO -->|Celebrities| SKIP[Skip Fanout]\nUR[User Opens Feed] --> FS[Feed Service]\nFS --> NFC\nFS -->|Fetch Celebrity Posts| DB\nFS --> RANK[Ranking Service]\nRANK --> FR[Feed Response]"} />

      <h3>Caching the Feed</h3>
      <p>
        Store each user&apos;s precomputed feed in Redis as a sorted set, scored by timestamp
        or relevance. Limit the cached feed to the most recent 800-1000 post IDs — users
        rarely scroll beyond this point. Store only post IDs in the feed cache, not full
        post content. When rendering the feed, fetch the complete post data (text, images,
        like counts, comments) from a separate post cache or database. This separation
        keeps the feed cache small and fast.
      </p>

      {/* ===== Section 6: Design - Rate Limiter ===== */}
      <h2>Design: Rate Limiter</h2>

      <h3>Requirements</h3>
      <ul>
        <li>
          <strong>Functional:</strong> Limit API requests by user ID, IP address, or API key.
          Support different rate limits for different endpoints. Return HTTP 429 when the
          limit is exceeded.
        </li>
        <li>
          <strong>Non-functional:</strong> Extremely low latency (must not add perceptible
          delay to legitimate requests), distributed (consistent behavior across multiple
          servers), fault tolerant (fail-open so a rate limiter outage does not block all traffic)
        </li>
      </ul>

      <h3>Algorithms</h3>
      <p>
        <strong>Token Bucket:</strong> Each user has a bucket that holds up to N tokens.
        Tokens are added at a fixed rate (e.g., 10 per second). Each request consumes one
        token. If the bucket is empty, the request is rejected. This algorithm is simple,
        memory-efficient, and naturally allows short bursts of traffic above the average
        rate.
      </p>
      <p>
        <strong>Sliding Window Log:</strong> Store the timestamp of each request in a sorted
        set. For each new request, remove timestamps older than the window size and check
        whether the remaining count exceeds the limit. This approach is precise but uses
        more memory because it stores every individual request timestamp.
      </p>
      <p>
        <strong>Sliding Window Counter:</strong> A hybrid approach that uses counters for
        the current and previous time windows, weighted by overlap. For example, if you
        are 30% into the current minute, the effective count is
        (previous window count * 0.7) + (current window count). This is approximate
        but highly memory-efficient — only two counters per user per rule.
      </p>

      <FlowChart chart={"graph TD\nClient[Client Request] --> RL[Rate Limiter]\nRL --> RC[Rules Cache - Redis]\nRC --> RDB[Rules Database]\nRL -->|Allowed| API[API Server]\nRL -->|Rejected| R429[HTTP 429 Response]\nAPI --> BE[Backend Services]"} />

      <h3>Where to Place It</h3>
      <p>
        Rate limiting can live at the API gateway level (centralized, easy to manage and
        update rules), as middleware in each microservice (more granular per-service
        control), or as a dedicated distributed service. For most systems, implementing
        it at the API gateway is the best starting point. Store counters in Redis using
        the INCR command with TTL — Redis is fast enough to add negligible latency and
        handles distributed access across multiple gateway instances natively.
      </p>

      {/* ===== Section 7: Design - Notification System ===== */}
      <h2>Design: Notification System</h2>

      <h3>Requirements</h3>
      <ul>
        <li>
          <strong>Channels:</strong> Push notifications (iOS and Android), email, SMS,
          in-app notifications
        </li>
        <li>
          <strong>Features:</strong> User preferences (opt-in/opt-out per channel), priority
          levels, rate limiting per user, retry on failure, deduplication
        </li>
        <li>
          <strong>Scale:</strong> 10M notifications/day across all channels, with traffic
          spikes during promotional events
        </li>
      </ul>

      <FlowChart chart={"graph TD\nES[Event Source] --> NS[Notification Service]\nNS --> VP[Validate Preferences]\nVP --> PQ[Priority Queue]\nPQ --> PA[Push Adapter]\nPQ --> EA[Email Adapter]\nPQ --> SA[SMS Adapter]\nPQ --> IA[In-App Adapter]\nPA --> APNS[APNs and FCM]\nEA --> SMTP[Email Provider]\nSA --> SMSP[SMS Provider]\nIA --> WSock[WebSocket Server]"} />

      <h3>Priority Queues</h3>
      <p>
        Not all notifications are equally urgent. A password reset code is critical and
        must arrive within seconds. A weekly newsletter can wait hours. Use separate
        message queues for different priority levels — critical, high, medium, and low.
        Critical notifications are processed immediately by dedicated workers. Low-priority
        notifications can be batched and sent during off-peak hours to reduce cost and
        avoid overwhelming users.
      </p>

      <h3>Retry and Failure Handling</h3>
      <p>
        Third-party delivery services (APNs, Twilio, SendGrid) can fail temporarily due
        to rate limits, network issues, or outages. Implement exponential backoff with
        jitter and a maximum retry count (e.g., 3 retries over 15 minutes). After
        exhausting retries, move the failed notification to a dead letter queue for manual
        investigation. Track delivery status (pending, sent, delivered, failed) for every
        notification so you can debug delivery issues and report on success rates.
      </p>

      <h3>User Preferences and Deduplication</h3>
      <p>
        Store user preferences in a dedicated service: which channels they have opted into,
        quiet hours (do not send push notifications between 10 PM and 8 AM in the
        user&apos;s local timezone), and frequency caps (maximum 5 marketing emails per week).
        The notification service must check preferences before dispatching to any channel
        adapter. Use idempotency keys to prevent duplicate notifications when upstream
        events are retried or replayed — a common occurrence in event-driven architectures.
      </p>

      {/* ===== Section 8: Design - Search Autocomplete ===== */}
      <h2>Design: Search Autocomplete</h2>

      <h3>Requirements</h3>
      <ul>
        <li>
          <strong>Functional:</strong> Return the top 5-10 suggestions as the user types,
          ranked by popularity or relevance
        </li>
        <li>
          <strong>Non-functional:</strong> Response time &lt; 100ms (users expect instant
          feedback while typing), suggestions update daily based on trending queries
        </li>
        <li>
          <strong>Scale:</strong> 10,000 QPS at peak, suggestion corpus of 100M unique
          query strings
        </li>
      </ul>

      <h3>Trie Data Structure</h3>
      <p>
        A trie (prefix tree) is the classic data structure for autocomplete. Each node
        represents a character, and paths from root to leaf spell out complete query
        strings. The critical optimization: at each node, store a precomputed list of the
        top-K most popular completions. This avoids traversing the entire subtree at query
        time, turning each lookup into an O(p) operation where p is the length of the
        prefix the user has typed so far.
      </p>

      <FlowChart chart={"graph TD\nUT[User Types Query] --> FE[Frontend - Debounce 200ms]\nFE --> API[Autocomplete API]\nAPI --> TC[Trie Cache - Redis]\nTC -->|Cache Hit| RS[Return Top Suggestions]\nTC -->|Cache Miss| TS[Trie Service]\nTS --> RS\nLP[Search Log Pipeline] --> LA[Log Aggregator]\nLA --> TB[Trie Builder - Offline Job]\nTB -->|Weekly Rebuild| TS"} />

      <h3>Updating Suggestions</h3>
      <p>
        Do not update the trie in real-time — concurrent modifications to a trie are
        complex and rebuilding is expensive. Instead, run an offline pipeline: aggregate
        search logs from the past week, compute query frequencies, rebuild the trie from
        scratch, and swap it in atomically using a blue-green deployment strategy.
        Run this daily or weekly depending on freshness requirements. For trending topics
        that need faster updates, maintain a small separate real-time counter service that
        supplements the main trie with recent popular queries.
      </p>

      <h3>Scaling for Low Latency</h3>
      <p>
        Cache the most popular prefixes aggressively in Redis. Single-character and
        two-character prefixes account for the vast majority of autocomplete requests and
        should always be served from cache. Deploy trie servers in multiple geographic
        regions so users hit nearby instances. On the client side, debounce keystrokes
        (wait 200-300ms after the user stops typing before sending a request) and cache
        previous prefix results in the browser to avoid redundant server round trips when
        the user deletes characters.
      </p>

      {/* ===== Section 9: Communication Tips ===== */}
      <h2>Communication Tips</h2>

      <p>
        Technical skill alone will not carry you through a system design interview. How
        you communicate your ideas is equally important — perhaps more so. These strategies
        distinguish strong candidates from average ones:
      </p>

      <h3>Think Out Loud</h3>
      <p>
        The interviewer cannot evaluate what they cannot hear. Narrate your thought
        process as you work through the problem. Say things like &quot;I am considering two
        approaches here — let me walk through the trade-offs&quot; or &quot;My instinct is to use
        a relational database, but let me think about whether a NoSQL store might be
        better for this access pattern.&quot; This gives the interviewer a window into your
        reasoning and lets them redirect you early if you go off track.
      </p>

      <h3>Draw Diagrams First</h3>
      <p>
        Start by sketching the high-level architecture before diving into any details.
        A visual diagram anchors the conversation and ensures you and the interviewer
        are looking at the same system. Label every box with its component name and every
        arrow with what data flows between the components. As you deep dive into specific
        areas, annotate the diagram with additional details like data sizes, QPS numbers,
        or technology choices.
      </p>

      <h3>Ask Clarifying Questions</h3>
      <p>
        Strong candidates ask 3-5 targeted questions before starting their design.
        This demonstrates that you understand real-world systems are built for specific
        constraints, not in a vacuum. Good questions target scale (how many users?),
        features (which are must-have vs nice-to-have?), and constraints (latency
        SLAs, consistency requirements, geographic distribution).
      </p>

      <h3>Discuss Trade-offs Proactively</h3>
      <p>
        For every major design decision, briefly mention the alternative you considered
        and why you chose the approach you did. For example: &quot;I am choosing a SQL
        database here because we need ACID transactions for financial data, even though
        a NoSQL store would give us better horizontal scalability.&quot; This demonstrates
        engineering judgment — you are not just picking tools, you are making informed
        decisions based on requirements.
      </p>

      <h3>Structure Your Answer</h3>
      <p>
        Use signposting to keep your response organized: &quot;First, let me define the
        requirements. Next, I will sketch the high-level architecture. Then I will deep
        dive into the data model.&quot; This helps the interviewer follow your logic and
        shows that you can organize complex information clearly — a critical skill for
        senior engineers who must communicate designs to teams.
      </p>

      <InfoBox variant="info" title="What Interviewers Actually Evaluate">
        <p>
          Interviewers evaluate four dimensions: (1) your ability to scope a problem
          and gather requirements, (2) your knowledge of system building blocks —
          databases, caches, queues, load balancers, CDNs, (3) your ability to make
          and justify design decisions with clear trade-offs, and (4) your communication
          and collaboration style. Notice that &quot;finding the perfect answer&quot; is not on
          this list. There is no single right answer — only well-reasoned and
          poorly-reasoned approaches.
        </p>
      </InfoBox>

      {/* ===== Section 10: Common Mistakes ===== */}
      <h2>Common Mistakes</h2>

      <p>
        Awareness of common pitfalls is the first step to avoiding them. These are the
        mistakes that derail even experienced engineers during system design interviews:
      </p>

      <ul>
        <li>
          <strong>Not clarifying requirements:</strong> Designing a system for 1,000 users
          is completely different from designing one for 1 billion users. The architecture,
          database choices, caching strategies, and infrastructure all change dramatically
          with scale. Always ask about users, traffic, and growth expectations.
        </li>
        <li>
          <strong>Over-engineering (YAGNI):</strong> Do not introduce microservices, event
          sourcing, CQRS, and Kubernetes for a system that handles 100 requests per day.
          Start with the simplest architecture that meets the requirements, then explain
          how you would evolve it as the system grows.
        </li>
        <li>
          <strong>Ignoring non-functional requirements:</strong> Availability, latency,
          durability, and consistency are not afterthoughts — they should drive your
          architecture decisions from the very beginning. A system that is functionally
          correct but has 10-second latency is not a good system.
        </li>
        <li>
          <strong>Not discussing trade-offs:</strong> Saying &quot;I would use MongoDB&quot; without
          explaining why you chose it over PostgreSQL or DynamoDB is a red flag. Every
          technology and architecture choice should come with a brief justification
          that ties back to the requirements.
        </li>
        <li>
          <strong>Going too deep too early:</strong> Do not spend 15 minutes perfecting a
          database schema before you have sketched the overall architecture. Demonstrate
          breadth first by showing the complete picture, then go deep on the most critical
          or interesting components.
        </li>
        <li>
          <strong>Ignoring failure modes:</strong> What happens when a server crashes? When
          the primary database becomes unavailable? When a downstream service times out?
          Discussing resilience, redundancy, and graceful degradation shows senior-level
          thinking that separates you from junior candidates.
        </li>
      </ul>

      <InteractiveChallenge
        question={"During a system design interview, you realize your initial design will not handle the required scale. What should you do?"}
        options={[
          'Start over with a completely new design from scratch',
          'Acknowledge the limitation, explain why it fails at scale, and evolve the design to address it',
          'Hope the interviewer does not notice the scalability issue',
          'Immediately jump to discussing database sharding without explaining the context'
        ]}
        correctIndex={1}
        explanation={"Interviewers want to see you identify problems in your own design and iterate systematically. Acknowledging a limitation shows self-awareness, and evolving the design demonstrates real problem-solving ability. Starting over wastes precious interview time, and hiding problems destroys trust immediately."}
      />

      {/* ===== Section 11: Handling Unknown Topics ===== */}
      <h2>Handling Unknown Topics</h2>

      <p>
        At some point in your career, an interviewer will ask you to design a system
        you have never encountered before. This is intentional — they want to see how
        you reason through unfamiliar problems, not whether you have memorized solutions
        from a textbook.
      </p>

      <h3>Reason from First Principles</h3>
      <p>
        Break the unknown system into familiar building blocks. Every system ultimately
        involves three things: storing data, processing data, and delivering data to
        users. Ask yourself: What data does this system need to store? How does data
        flow through the system from input to output? Where are the performance
        bottlenecks likely to be? This decomposition works for any system, even one
        you have never seen before.
      </p>

      <h3>Map to Known Patterns</h3>
      <p>
        Most systems are variations of a few core architectural patterns: request-response
        APIs, event-driven pipelines, real-time streaming, batch processing, or pub/sub
        messaging. Once you identify which pattern the unknown system most closely
        resembles, you can leverage your deep knowledge of that pattern and adapt it to
        the specific requirements at hand.
      </p>

      <h3>Be Transparent About Gaps</h3>
      <p>
        If you genuinely do not know something specific — a particular protocol, algorithm,
        or technology — say so clearly and constructively. For example: &quot;I am not deeply
        familiar with the RAFT consensus algorithm, but I understand it addresses leader
        election in distributed systems. Let me reason about what properties we need
        from a consensus mechanism here and we can discuss the best option.&quot;
      </p>

      <InfoBox variant="tip" title="Honesty Builds Trust">
        <p>
          Interviewers respect candidates who are honest about gaps in their knowledge.
          Bluffing is surprisingly easy to detect and immediately erodes credibility.
          Saying &quot;I do not know the specifics, but here is how I would reason about it&quot;
          is always better than fabricating an answer. Senior engineers are hired for
          their ability to navigate ambiguity and learn quickly — not for having
          memorized every technology in existence.
        </p>
      </InfoBox>

      {/* ===== Section 12: Time Management ===== */}
      <h2>Time Management</h2>

      <p>
        A typical system design interview lasts 45 minutes. Poor time management is one
        of the most frequent reasons candidates receive negative feedback — they spend
        too long clarifying requirements, get lost in a deep dive on a secondary component,
        or never reach the discussion of scaling and reliability that demonstrates
        senior-level thinking.
      </p>

      <h3>Recommended Time Allocation</h3>
      <table>
        <thead>
          <tr>
            <th>Phase</th>
            <th>Time</th>
            <th>Goal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Clarify Requirements</td>
            <td>3-5 min</td>
            <td>Scope defined, key constraints identified and written down</td>
          </tr>
          <tr>
            <td>High-Level Design</td>
            <td>10-15 min</td>
            <td>Architecture diagram with all major components and data flows</td>
          </tr>
          <tr>
            <td>Deep Dive</td>
            <td>15-20 min</td>
            <td>2-3 components explored in detail with trade-off discussions</td>
          </tr>
          <tr>
            <td>Wrap-up</td>
            <td>3-5 min</td>
            <td>Bottlenecks identified, monitoring discussed, improvements noted</td>
          </tr>
        </tbody>
      </table>

      <h3>When to Move On</h3>
      <p>
        If you have been discussing one topic for more than 5-7 minutes without the
        interviewer asking follow-up questions or showing active interest, it is time
        to transition. Say something like &quot;I could go deeper on this, but let me first
        make sure we cover the other critical components.&quot; The interviewer will redirect
        you back if they want more depth on a specific area. Your goal is to demonstrate
        both breadth and depth — do not sacrifice one for the other.
      </p>

      <h3>Recovering from Time Pressure</h3>
      <p>
        If you find yourself running behind, do not panic. Quickly summarize the areas
        you have not covered yet (&quot;For the caching layer, I would use Redis with an
        LRU eviction policy, and for monitoring I would track p99 latency and error
        rates&quot;) and then spend remaining time on whatever the interviewer finds most
        interesting. Showing that you can prioritize under pressure is itself a
        positive signal.
      </p>

      <InteractiveChallenge
        question={"You are 25 minutes into a 45-minute interview and have not started the deep dive yet. What is the best approach?"}
        options={[
          'Rush through the remaining content as fast as possible',
          'Ask the interviewer for extra time to finish your design',
          'Quickly summarize your high-level design, then prioritize the single most critical deep-dive topic',
          'Skip the deep dive entirely and go straight to the wrap-up phase'
        ]}
        correctIndex={2}
        explanation={"When time is tight, prioritize demonstrating depth on at least one critical component rather than rushing or skipping. A concise summary of your high-level design shows you have the complete picture, and a focused deep dive on the most important area demonstrates genuine technical depth. Interviewers prefer quality insight over shallow coverage."}
      />

      <h2>Final Thoughts</h2>

      <p>
        System design interviews reward structured thinking, clear communication, and the
        ability to navigate trade-offs under uncertainty. You do not need to memorize every
        architecture pattern or recall exact numbers for every metric. What you need is the
        ability to reason through complex problems methodically, explain your decisions
        clearly, and adapt when new information changes the constraints.
      </p>
      <p>
        Practice the four-step framework until it becomes second nature. Study the core
        building blocks — databases, caches, load balancers, message queues, CDNs — so
        you can assemble them fluently. And remember: the interview is a collaborative
        conversation, not a test with a single right answer. The interviewer is your
        partner in exploring the design space. Treat them that way, and you will perform
        at your best.
      </p>
    </LessonLayout>
  );
}
