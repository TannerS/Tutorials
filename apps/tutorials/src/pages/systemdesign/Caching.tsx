import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Caching() {
  return (
    <LessonLayout
      title="Caching Strategies"
      sectionId="systemdesign"
      lessonIndex={2}
      prev={{ path: '/systemdesign/scaling', label: 'Scaling &amp; Load Balancing' }}
      next={{ path: '/systemdesign/databases', label: 'Database Design &amp; Scaling' }}
    >
      {/* ================================================================
          SECTION 1: WHY CACHE?
          ================================================================ */}

      <h2>Why Cache?</h2>
      <p>
        Caching is the single most effective technique for improving application performance. By
        storing frequently accessed data in a fast, temporary storage layer, you can reduce latency
        from hundreds of milliseconds down to single-digit milliseconds. Caching sits between your
        application and slower data sources — databases, APIs, file systems — and intercepts
        requests before they hit the expensive backend.
      </p>

      <FlowChart
        title="Request With Cache vs Without Cache"
        chart={"graph TD\n  subgraph Without Cache\n    A1[Client Request] --> B1[Application Server]\n    B1 --> C1[Database Query ~50-200ms]\n    C1 --> D1[Return Response ~200ms total]\n  end\n  subgraph With Cache\n    A2[Client Request] --> B2[Application Server]\n    B2 --> E2{Cache Hit?}\n    E2 -->|Hit ~1-5ms| F2[Return Cached Data ~5ms total]\n    E2 -->|Miss| G2[Database Query ~50-200ms]\n    G2 --> H2[Store in Cache]\n    H2 --> I2[Return Response ~200ms first time]\n  end\n  style F2 fill:#10b981,color:#fff\n  style D1 fill:#ef4444,color:#fff\n  style E2 fill:#6366f1,color:#fff"}
      />

      <h3>Common Caching Use Cases</h3>
      <ul>
        <li><strong>Database query results:</strong> Cache expensive or frequently repeated queries to avoid redundant database load</li>
        <li><strong>API responses:</strong> Cache responses from third-party APIs to reduce latency and avoid rate limits</li>
        <li><strong>Session data:</strong> Store user sessions in Redis instead of hitting the database on every request</li>
        <li><strong>Computed results:</strong> Cache the output of expensive calculations, aggregations, or report generation</li>
        <li><strong>Static assets:</strong> CDN caching for images, CSS, JavaScript files</li>
        <li><strong>Configuration data:</strong> Cache application config that rarely changes but is read on every request</li>
      </ul>

      <InfoBox variant="info" title="The 80/20 Rule of Caching">
        In most applications, roughly 80% of requests access only 20% of the data. This is known as
        the Pareto principle, and it is what makes caching so effective. You do not need to cache
        everything — caching only the &quot;hot&quot; 20% of data can eliminate 80% of your database load.
        Identify your hot keys and cache those first.
      </InfoBox>

      {/* ================================================================
          SECTION 2: CACHE-ASIDE PATTERN (LAZY LOADING)
          ================================================================ */}

      <h2>Cache-Aside Pattern (Lazy Loading)</h2>
      <p>
        Cache-aside is the most common caching pattern. The application is responsible for reading
        from and writing to the cache. The cache does not interact with the database directly —
        the application manages everything. Data is loaded into the cache lazily, only when it is
        first requested.
      </p>

      <h3>How It Works</h3>
      <ol>
        <li>Application receives a request for data</li>
        <li>Application checks the cache for the requested key</li>
        <li>If the key exists (cache hit), return the cached value immediately</li>
        <li>If the key does not exist (cache miss), query the database</li>
        <li>Store the result in the cache with a TTL (time to live)</li>
        <li>Return the result to the caller</li>
      </ol>

      <FlowChart
        title="Cache-Aside Pattern Flow"
        chart={"graph TD\n  A[App Receives Request] --> B{Check Cache}\n  B -->|Cache Hit| C[Return Cached Data]\n  B -->|Cache Miss| D[Query Database]\n  D --> E[Store Result in Cache]\n  E --> F[Return Data to Client]\n  style C fill:#10b981,color:#fff\n  style D fill:#f59e0b,color:#000\n  style E fill:#6366f1,color:#fff"}
      />

      <h3>Pros and Cons</h3>
      <ul>
        <li><strong>Pro:</strong> Only requested data is cached — no wasted memory on data nobody reads</li>
        <li><strong>Pro:</strong> Cache failures are non-fatal — the app falls back to the database</li>
        <li><strong>Pro:</strong> Simple to implement and understand</li>
        <li><strong>Con:</strong> First request is always a cache miss (cold start penalty)</li>
        <li><strong>Con:</strong> Data can become stale if the database is updated without invalidating the cache</li>
        <li><strong>Con:</strong> Application code must handle both cache and database logic</li>
      </ul>

      <CodeBlock language="javascript" title="Cache-Aside Implementation">
{`async function getUserById(userId) {
  const cacheKey = \`user:\${userId}\`;

  // Step 1: Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);  // Cache hit
  }

  // Step 2: Cache miss — query database
  const user = await db.query(
    'SELECT * FROM users WHERE id = $1', [userId]
  );

  if (user) {
    // Step 3: Store in cache with 5-minute TTL
    await redis.setex(cacheKey, 300, JSON.stringify(user));
  }

  return user;
}

// When updating, invalidate the cache
async function updateUser(userId, data) {
  await db.query(
    'UPDATE users SET name = $1 WHERE id = $2',
    [data.name, userId]
  );
  // Delete stale cache entry
  await redis.del(\`user:\${userId}\`);
}`}
      </CodeBlock>

      {/* ================================================================
          SECTION 3: READ-THROUGH CACHE
          ================================================================ */}

      <h2>Read-Through Cache</h2>
      <p>
        In a read-through cache, the cache itself is responsible for loading data from the database
        on a cache miss. The application only interacts with the cache — it never queries the
        database directly. The cache library or middleware handles the read-through logic.
      </p>

      <h3>How It Differs from Cache-Aside</h3>
      <ul>
        <li><strong>Cache-Aside:</strong> Application manages both cache and database reads — two separate code paths</li>
        <li><strong>Read-Through:</strong> Application only talks to the cache — the cache loads data from the database transparently</li>
      </ul>

      <FlowChart
        title="Read-Through Cache Flow"
        chart={"graph TD\n  A[App Requests Data] --> B[Cache Layer]\n  B --> C{Key Exists?}\n  C -->|Hit| D[Return Cached Data]\n  C -->|Miss| E[Cache Loads from DB]\n  E --> F[Cache Stores Data]\n  F --> G[Return Data to App]\n  style B fill:#6366f1,color:#fff\n  style D fill:#10b981,color:#fff\n  style E fill:#f59e0b,color:#000"}
      />

      <h3>When to Use Read-Through</h3>
      <ul>
        <li>When you want to simplify application code by abstracting cache management</li>
        <li>When using a cache library or framework that supports read-through (e.g., Caffeine, Guava, NCache)</li>
        <li>When multiple services need the same caching logic — centralize it in the cache layer</li>
      </ul>

      {/* ================================================================
          SECTION 4: WRITE-THROUGH CACHE
          ================================================================ */}

      <h2>Write-Through Cache</h2>
      <p>
        In a write-through pattern, the application writes data to the cache, and the cache
        synchronously writes the data to the database before confirming the write. This ensures
        the cache and database are always consistent.
      </p>

      <FlowChart
        title="Write-Through Cache Flow"
        chart={"graph TD\n  A[App Writes Data] --> B[Write to Cache]\n  B --> C[Cache Writes to DB Synchronously]\n  C --> D{DB Write Success?}\n  D -->|Yes| E[Acknowledge Write to App]\n  D -->|No| F[Rollback Cache + Return Error]\n  style B fill:#6366f1,color:#fff\n  style C fill:#f59e0b,color:#000\n  style E fill:#10b981,color:#fff\n  style F fill:#ef4444,color:#fff"}
      />

      <h3>Pros and Cons</h3>
      <ul>
        <li><strong>Pro:</strong> Cache and database are always consistent — no stale data</li>
        <li><strong>Pro:</strong> Reads after writes are always cache hits — great for read-after-write patterns</li>
        <li><strong>Con:</strong> Higher write latency — every write goes through two steps (cache + DB)</li>
        <li><strong>Con:</strong> Infrequently-read data still gets cached, wasting memory</li>
        <li><strong>Best for:</strong> Systems where data consistency is critical and write volume is moderate</li>
      </ul>

      {/* ================================================================
          SECTION 5: WRITE-BEHIND (WRITE-BACK) CACHE
          ================================================================ */}

      <h2>Write-Behind (Write-Back) Cache</h2>
      <p>
        Write-behind is similar to write-through, but the cache writes to the database
        asynchronously. The application writes to the cache and receives an immediate acknowledgment.
        The cache then flushes changes to the database in the background, often batching multiple
        writes for efficiency.
      </p>

      <FlowChart
        title="Write-Behind Cache Flow"
        chart={"graph TD\n  A[App Writes Data] --> B[Write to Cache]\n  B --> C[Acknowledge Write Immediately]\n  B --> D[Async Queue]\n  D --> E[Batch Write to DB]\n  E --> F{DB Write Success?}\n  F -->|Yes| G[Complete]\n  F -->|No| H[Retry / Dead Letter Queue]\n  style C fill:#10b981,color:#fff\n  style D fill:#f59e0b,color:#000\n  style H fill:#ef4444,color:#fff"}
      />

      <h3>Pros and Cons</h3>
      <ul>
        <li><strong>Pro:</strong> Very low write latency — app does not wait for database writes</li>
        <li><strong>Pro:</strong> Batching reduces database write load significantly</li>
        <li><strong>Con:</strong> Risk of data loss if the cache node crashes before flushing to the database</li>
        <li><strong>Con:</strong> Eventual consistency — database may lag behind the cache</li>
        <li><strong>Best for:</strong> High write-throughput systems where some data loss is acceptable (e.g., analytics, logging)</li>
      </ul>

      <InfoBox variant="warning" title="Data Loss Risk">
        Write-behind caching introduces a window of potential data loss. If the cache node crashes
        before the asynchronous write completes, that data is gone. To mitigate this, use Redis
        with AOF persistence, maintain a write-ahead log, or use a message queue (Kafka, RabbitMQ)
        as the async buffer instead of relying solely on the cache&apos;s memory.
      </InfoBox>

      {/* ================================================================
          SECTION 6: WRITE-AROUND CACHE
          ================================================================ */}

      <h2>Write-Around Cache</h2>
      <p>
        In write-around, the application writes data directly to the database, bypassing the cache
        entirely. The cache is only populated on reads (via cache-aside or read-through). This
        prevents the cache from being filled with data that may never be read.
      </p>

      <h3>How It Works</h3>
      <ol>
        <li>Application writes data directly to the database — cache is not updated</li>
        <li>On subsequent reads, the cache-aside pattern loads the data into the cache</li>
        <li>Only data that is actually read gets cached</li>
      </ol>

      <h3>When to Use Write-Around</h3>
      <ul>
        <li>When most written data is not immediately read (e.g., audit logs, historical records)</li>
        <li>When you want to avoid cache pollution with write-heavy data</li>
        <li>When combined with cache-aside for reads — write-around handles writes, cache-aside handles reads</li>
        <li>Trade-off: first read after a write is always a cache miss</li>
      </ul>

      {/* ================================================================
          SECTION 7: CACHE EVICTION POLICIES
          ================================================================ */}

      <h2>Cache Eviction Policies</h2>
      <p>
        Caches have limited memory. When the cache is full and a new entry needs to be stored,
        the cache must evict an existing entry. The eviction policy determines which entry to remove.
        Choosing the right eviction policy is crucial for cache hit rates.
      </p>

      <h3>LRU — Least Recently Used</h3>
      <p>
        Evicts the entry that has not been accessed for the longest time. This is the most commonly
        used eviction policy and works well for most workloads. It assumes that recently accessed
        data is more likely to be accessed again (temporal locality).
      </p>

      <h3>LFU — Least Frequently Used</h3>
      <p>
        Evicts the entry that has been accessed the fewest times. This works well when some data is
        consistently popular — it protects hot data from being evicted by a burst of one-time
        accesses. However, it can be slow to adapt to changing access patterns because old popular
        entries retain high counts.
      </p>

      <h3>FIFO — First In First Out</h3>
      <p>
        Evicts the oldest entry regardless of how recently or frequently it was accessed. Simple to
        implement but generally provides worse hit rates than LRU or LFU. Useful when all entries
        have similar access patterns.
      </p>

      <h3>TTL — Time To Live</h3>
      <p>
        Each entry has an expiration time. After the TTL expires, the entry is automatically removed
        (either immediately or lazily on next access). TTL is not strictly an eviction policy but is
        used alongside LRU/LFU to prevent stale data. Most caches use TTL + LRU together.
      </p>

      <h3>Eviction Policy Comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Policy</th>
            <th>Evicts</th>
            <th>Best For</th>
            <th>Weakness</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>LRU</td>
            <td>Least recently accessed</td>
            <td>General-purpose, most workloads</td>
            <td>Scan pollution (one-time bulk reads evict hot data)</td>
          </tr>
          <tr>
            <td>LFU</td>
            <td>Least frequently accessed</td>
            <td>Stable popularity distributions</td>
            <td>Slow to adapt when popularity shifts</td>
          </tr>
          <tr>
            <td>FIFO</td>
            <td>Oldest entry</td>
            <td>Simple, uniform access patterns</td>
            <td>Ignores access frequency and recency</td>
          </tr>
          <tr>
            <td>TTL</td>
            <td>Expired entries</td>
            <td>Time-sensitive data, staleness control</td>
            <td>Not size-based — won&apos;t free space on demand</td>
          </tr>
          <tr>
            <td>Random</td>
            <td>Random entry</td>
            <td>When access patterns are unpredictable</td>
            <td>May evict hot data</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"Your cache is full and you observe a periodic batch job scanning millions of records once per day. After the batch job runs, your cache hit rate drops from 95% to 20%. Which eviction policy would best prevent this?"}
        options={[
          'FIFO — evict the oldest entries first',
          'LRU — evict least recently used entries',
          'LFU — evict least frequently used entries',
          'Random — evict random entries'
        ]}
        correctIndex={2}
        explanation={"LFU protects frequently accessed (hot) data from being evicted by a burst of one-time accesses. The batch job reads each record once, giving each a frequency count of 1. With LFU, these low-frequency entries are evicted first, preserving the hot data that your application actually needs. LRU would fail here because the batch job's one-time reads would be the 'most recently used' entries, causing hot data to be evicted."}
      />

      {/* ================================================================
          SECTION 8: REDIS OVERVIEW
          ================================================================ */}

      <h2>Redis Overview</h2>
      <p>
        Redis (Remote Dictionary Server) is the most popular in-memory data store used for caching.
        It is not just a key-value store — Redis supports rich data types, atomic operations,
        pub/sub messaging, Lua scripting, and more. Understanding Redis data types and commands is
        essential for system design interviews.
      </p>

      <h3>Key Data Types</h3>
      <ul>
        <li><strong>Strings:</strong> Simple key-value pairs. Can store text, numbers, or serialized JSON. Supports atomic increment/decrement for counters.</li>
        <li><strong>Lists:</strong> Ordered collections of strings. Support push/pop from both ends. Great for queues, recent activity feeds, and message buffers.</li>
        <li><strong>Sets:</strong> Unordered collections of unique strings. Support set operations (union, intersection, difference). Great for tags, unique visitors, and membership checks.</li>
        <li><strong>Sorted Sets:</strong> Sets where each member has a score. Members are ordered by score. Perfect for leaderboards, rate limiting windows, and priority queues.</li>
        <li><strong>Hashes:</strong> Maps of field-value pairs under a single key. Perfect for storing objects (user profiles, product details) without serializing to JSON.</li>
      </ul>

      <CodeBlock language="bash" title="Essential Redis Commands">
{`# Strings
SET user:123 '{"name":"Alice","role":"admin"}'
GET user:123
SETEX session:abc 3600 '{"userId":123}'   # Set with 1-hour TTL
INCR page:views:homepage                   # Atomic counter

# Hashes — store objects as fields
HSET user:123 name "Alice" role "admin" email "alice@co.com"
HGET user:123 name                         # Get single field
HGETALL user:123                           # Get all fields

# Lists — queues and recent items
LPUSH notifications:user:123 "New message from Bob"
RPOP notifications:user:123                # Process oldest first
LRANGE recent:posts 0 9                    # Get 10 most recent

# Sets — unique collections
SADD online:users "user:123" "user:456"
SISMEMBER online:users "user:123"          # Check membership
SCARD online:users                         # Count members

# Sorted Sets — leaderboards
ZADD leaderboard 1500 "player:alice"
ZADD leaderboard 2200 "player:bob"
ZREVRANGE leaderboard 0 9 WITHSCORES      # Top 10 players

# Key management
TTL user:123                               # Check remaining TTL
EXPIRE user:123 600                        # Set TTL to 10 minutes
DEL user:123                               # Delete key
KEYS user:*                                # Find keys (AVOID in prod)
SCAN 0 MATCH user:* COUNT 100             # Safe iteration`}
      </CodeBlock>

      <h3>Redis as Cache vs Redis as Primary Store</h3>
      <ul>
        <li><strong>As Cache:</strong> Volatile, TTL on all keys, eviction policy set (allkeys-lru), data loss is acceptable, backed by a primary database</li>
        <li><strong>As Primary Store:</strong> Persistence enabled (RDB snapshots + AOF log), replication configured, data loss is NOT acceptable, requires careful memory management</li>
      </ul>

      <InfoBox variant="info" title="Redis Persistence Options">
        <ul>
          <li><strong>RDB Snapshots:</strong> Point-in-time snapshots at configured intervals (e.g., every 5 minutes). Fast restarts but you lose data since the last snapshot.</li>
          <li><strong>AOF (Append Only File):</strong> Logs every write operation. More durable (can sync every second or every write) but slower restarts and larger files.</li>
          <li><strong>RDB + AOF:</strong> Use both for the best durability. AOF is used for recovery, RDB for faster restarts.</li>
          <li><strong>No persistence:</strong> Pure cache mode. Fastest performance, all data lost on restart.</li>
        </ul>
      </InfoBox>

      {/* ================================================================
          SECTION 9: CACHE INVALIDATION STRATEGIES
          ================================================================ */}

      <h2>Cache Invalidation Strategies</h2>
      <p>
        &quot;There are only two hard things in Computer Science: cache invalidation and naming things.&quot;
        — Phil Karlton. Cache invalidation is the process of removing or updating stale data
        from the cache when the underlying source of truth changes. Getting this wrong leads to
        users seeing stale data, inconsistent state, and hard-to-debug production issues.
      </p>

      <h3>Time-Based Invalidation (TTL)</h3>
      <p>
        The simplest approach: set a TTL on every cache entry. After the TTL expires, the entry is
        automatically evicted and the next read fetches fresh data from the database. This is the
        most common strategy and works well when some staleness is acceptable.
      </p>
      <ul>
        <li><strong>Short TTL (seconds):</strong> Near real-time freshness, higher database load</li>
        <li><strong>Long TTL (hours/days):</strong> Lower database load, more stale data</li>
        <li><strong>Choose TTL based on:</strong> How stale can this data be before users notice or it causes bugs?</li>
      </ul>

      <h3>Event-Based Invalidation</h3>
      <p>
        When data changes, explicitly delete or update the corresponding cache entries. This can be
        done directly in the application code (after a database write, delete the cache key) or via
        an event system (database change events trigger cache invalidation).
      </p>
      <ul>
        <li>Direct invalidation: <code>redis.del(&quot;user:123&quot;)</code> after updating user 123</li>
        <li>Pub/sub: Publish an event on data change, subscribers invalidate their local caches</li>
        <li>CDC (Change Data Capture): Tools like Debezium stream database changes to Kafka, which triggers cache invalidation</li>
      </ul>

      <h3>Version-Based Invalidation</h3>
      <p>
        Embed a version number in the cache key. When data changes, increment the version. Old
        cache entries are never explicitly deleted — they are simply never read again and eventually
        evicted by the eviction policy.
      </p>
      <ul>
        <li>Cache key: <code>user:123:v5</code> — when the user is updated, read from <code>user:123:v6</code></li>
        <li>Pro: No need for explicit deletion, no race conditions</li>
        <li>Con: Old versions waste memory until evicted</li>
      </ul>

      <InfoBox variant="warning" title="Cache Invalidation Is Hard">
        Cache invalidation bugs are among the most difficult to debug in production. Stale data
        can cause incorrect business logic, display wrong information to users, or create
        inconsistencies between services. When in doubt, use shorter TTLs and accept the
        performance trade-off. A slower correct system is always better than a fast incorrect one.
        Always ask: &quot;What happens if a user sees stale data here?&quot;
      </InfoBox>

      {/* ================================================================
          SECTION 10: DISTRIBUTED CACHING
          ================================================================ */}

      <h2>Distributed Caching</h2>
      <p>
        A single cache node has limited memory and is a single point of failure. Distributed caching
        spreads cache data across multiple nodes, providing higher capacity, fault tolerance, and
        horizontal scalability.
      </p>

      <h3>Why Single-Node Cache Is Not Enough</h3>
      <ul>
        <li><strong>Memory limit:</strong> A single Redis instance is limited to the machine&apos;s RAM (typically 64-256 GB)</li>
        <li><strong>Single point of failure:</strong> If the node crashes, all cached data is lost</li>
        <li><strong>Throughput limit:</strong> A single node can handle ~100K-200K operations per second — not enough for very high-traffic systems</li>
      </ul>

      <h3>Consistent Hashing for Cache Distribution</h3>
      <p>
        Consistent hashing distributes cache keys across nodes such that adding or removing a node
        only remaps a fraction of keys (approximately 1/N where N is the number of nodes) instead
        of all of them. This is critical for cache clusters because rehashing all keys would cause
        a massive cache miss storm.
      </p>
      <ul>
        <li>Each node is assigned a position on a hash ring</li>
        <li>Each key is hashed to a position on the ring</li>
        <li>The key is assigned to the first node clockwise from its position</li>
        <li>Virtual nodes (vnodes) ensure even distribution across physical nodes</li>
      </ul>

      <h3>Cache Replication</h3>
      <ul>
        <li><strong>Redis Sentinel:</strong> Automatic failover — promotes a replica to primary if the primary goes down. Provides high availability but not horizontal scaling of writes.</li>
        <li><strong>Redis Cluster:</strong> Automatic sharding across multiple nodes with built-in replication. Each shard has a primary + replicas. Supports horizontal scaling of both reads and writes.</li>
        <li><strong>Client-side sharding:</strong> The application decides which node to read/write based on a hashing function. Simple but no automatic failover.</li>
      </ul>

      {/* ================================================================
          SECTION 11: CACHE STAMPEDE PREVENTION
          ================================================================ */}

      <h2>Cache Stampede Prevention</h2>
      <p>
        A cache stampede (also called thundering herd) occurs when a popular cache key expires and
        hundreds or thousands of concurrent requests all miss the cache simultaneously, flooding the
        database with identical queries. This can overwhelm the database and cause cascading failures.
      </p>

      <FlowChart
        title="Cache Stampede Scenario"
        chart={"graph TD\n  A[Popular Cache Key Expires] --> B[1000 Concurrent Requests Arrive]\n  B --> C[All Check Cache]\n  C --> D[All Get Cache Miss]\n  D --> E[All Query Database Simultaneously]\n  E --> F[Database Overloaded]\n  F --> G[Timeouts and Failures]\n  style A fill:#f59e0b,color:#000\n  style E fill:#ef4444,color:#fff\n  style F fill:#ef4444,color:#fff\n  style G fill:#ef4444,color:#fff"}
      />

      <h3>Prevention Strategies</h3>

      <h4>1. Locking (Mutex Approach)</h4>
      <p>
        When a cache miss occurs, acquire a distributed lock before querying the database. Only
        the first request queries the database and repopulates the cache. All other requests wait
        for the lock to be released and then read from the cache.
      </p>
      <ul>
        <li>Use Redis <code>SET key value NX EX 10</code> as a distributed lock</li>
        <li>Only the lock holder queries the database</li>
        <li>Other requests either wait and retry, or return a stale value</li>
      </ul>

      <h4>2. Probabilistic Early Expiration</h4>
      <p>
        Instead of all entries expiring at the exact same time, each request has a small probability
        of refreshing the cache before the TTL actually expires. As the TTL approaches expiration,
        the probability increases. This spreads out cache refreshes over time, preventing a stampede.
      </p>

      <h4>3. Background Refresh</h4>
      <p>
        A background worker proactively refreshes popular cache entries before they expire. The
        cache never actually goes empty for hot keys — the worker repopulates them ahead of time.
        This ensures cache hits for the most critical data at all times.
      </p>

      <CodeBlock language="javascript" title="Cache Stampede Prevention with Locking">
{`async function getWithLock(key, fetchFn, ttl = 300) {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Acquire lock (NX = only if not exists, EX = 10s timeout)
  const lockKey = \`lock:\${key}\`;
  const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 10);

  if (acquired) {
    try {
      // We got the lock — fetch from database
      const data = await fetchFn();
      await redis.setex(key, ttl, JSON.stringify(data));
      return data;
    } finally {
      await redis.del(lockKey);  // Release lock
    }
  } else {
    // Another request holds the lock — wait and retry
    await sleep(50);  // Wait 50ms
    return getWithLock(key, fetchFn, ttl);  // Retry
  }
}

// Usage
const user = await getWithLock(
  'user:123',
  () => db.query('SELECT * FROM users WHERE id = $1', [123]),
  300  // 5-minute TTL
);`}
      </CodeBlock>

      {/* ================================================================
          SECTION 12: MULTI-TIER CACHING
          ================================================================ */}

      <h2>Multi-Tier Caching</h2>
      <p>
        In a production system, caching happens at multiple layers. Each tier trades off between
        speed, capacity, and freshness. A request passes through each tier in order — the fastest
        and closest caches are checked first.
      </p>

      <FlowChart
        title="Multi-Tier Cache Architecture"
        chart={"graph LR\n  A[Browser Cache] --> B[CDN Cache]\n  B --> C[API Gateway Cache]\n  C --> D[Application Cache / Redis]\n  D --> E[Database Query Cache]\n  E --> F[Database Disk]\n  style A fill:#10b981,color:#fff\n  style B fill:#06b6d4,color:#fff\n  style C fill:#3b82f6,color:#fff\n  style D fill:#6366f1,color:#fff\n  style E fill:#8b5cf6,color:#fff\n  style F fill:#ef4444,color:#fff"}
      />

      <h3>The Cache Tiers</h3>
      <ul>
        <li><strong>Browser Cache:</strong> Closest to the user. Controlled by Cache-Control headers. Zero network latency for cached resources. Stores static assets, API responses.</li>
        <li><strong>CDN Cache:</strong> Edge servers distributed globally. Reduces latency for geographically distributed users. Caches static assets and sometimes API responses.</li>
        <li><strong>API Gateway Cache:</strong> Caches entire API responses at the gateway level. Prevents requests from reaching backend services at all.</li>
        <li><strong>Application Cache (Redis/Memcached):</strong> In-memory cache shared across application instances. Caches database query results, computed values, session data.</li>
        <li><strong>Database Query Cache:</strong> Built-in query result caching in the database engine. Transparent to the application but limited in scope.</li>
      </ul>

      <CodeBlock language="http" title="Cache-Control Headers">
{`# Browser should cache for 1 hour, CDN for 1 day
Cache-Control: public, max-age=3600, s-maxage=86400

# No caching at all (sensitive data)
Cache-Control: no-store, no-cache, must-revalidate

# Private — only browser can cache, not CDN
Cache-Control: private, max-age=600

# Stale-while-revalidate — serve stale while fetching fresh
Cache-Control: max-age=60, stale-while-revalidate=300

# ETag-based validation — conditional requests
ETag: "abc123"
# Client sends: If-None-Match: "abc123"
# Server returns 304 Not Modified if unchanged

# Common patterns:
# Static assets (CSS/JS): public, max-age=31536000, immutable
# API responses:          private, max-age=0, must-revalidate
# User-specific data:     private, no-cache
# Public content:         public, max-age=300, s-maxage=3600`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You are designing a social media feed that shows posts from followed users. Each user's feed is unique. You need low latency but the feed must reflect new posts within 30 seconds. Which caching strategy combination would you use?"}
        options={[
          'Write-through cache with no TTL — perfect consistency',
          'Cache-aside with 30-second TTL + event-based invalidation on new posts',
          'Write-behind cache with LFU eviction',
          'CDN caching with 1-hour TTL for all feeds'
        ]}
        correctIndex={1}
        explanation={"Cache-aside with a short TTL ensures feeds are never more than 30 seconds stale. Event-based invalidation (when a new post is created, invalidate the feed caches of all followers) provides near-real-time updates for active users. Write-through would be wasteful since feeds are computed, not directly written. CDN caching won't work because each user's feed is unique (private data). Write-behind doesn't apply to reads."}
      />

      {/* ================================================================
          SUMMARY
          ================================================================ */}

      <h2>Summary</h2>

      <InfoBox variant="success" title="Key Takeaways">
        <ul>
          <li>Cache-aside is the most common pattern — application manages cache reads and writes separately</li>
          <li>Write-through guarantees consistency but adds write latency</li>
          <li>Write-behind reduces write latency but risks data loss</li>
          <li>LRU is the default eviction policy for most workloads — use LFU if scan pollution is a problem</li>
          <li>Redis is the go-to caching solution — know its data types, commands, and persistence options</li>
          <li>Cache invalidation is the hardest problem — when in doubt, use shorter TTLs</li>
          <li>Use distributed caching with consistent hashing for scalability</li>
          <li>Prevent cache stampedes with locking, early expiration, or background refresh</li>
          <li>Multi-tier caching (browser → CDN → app → DB) provides defense in depth</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
