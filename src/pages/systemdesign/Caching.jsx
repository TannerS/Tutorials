import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SysCaching() {
  return (
    <LessonLayout
      title="Caching Strategies"
      sectionId="systemdesign"
      lessonIndex={2}
      prev={{ path: '/systemdesign/scaling', label: 'Scaling Patterns' }}
      next={{ path: '/systemdesign/databases', label: 'Databases' }}
    >
      <h2>Why Caching?</h2>
      <p>
        Cache hit rates of 99% are common in read-heavy systems — this means 100× fewer database
        queries. Caching is the single highest-leverage optimization available. A well-placed Redis
        cache can handle 100,000+ ops/sec vs a database's 10,000 reads/sec.
      </p>

      <FlowChart
        title="Cache Read Path"
        chart={"graph LR\n  A[Request] --> B{Cache Hit?}\n  B -- Yes --> C[Return cached data]\n  B -- No --> D[Query Database]\n  D --> E[Store in Cache]\n  E --> F[Return data]\n  C --> G[Response in < 1ms]\n  F --> H[Response in 10-100ms]"}
      />

      <h2>Caching Patterns</h2>

      <CodeBlock language="java" title="Cache-Aside (Lazy Loading) — Most Common">
{`// Also called "look-aside" or "lazy population"
// Application manages the cache explicitly
// Cache is NOT automatically in sync — app reads/writes both

@Service
public class UserService {
    @Autowired private UserRepository userRepo;
    @Autowired private RedisTemplate<String, User> redis;

    private static final Duration TTL = Duration.ofMinutes(30);

    public User getUser(Long id) {
        String key = "user:" + id;

        // 1. Try cache first
        User cached = redis.opsForValue().get(key);
        if (cached != null) {
            return cached; // cache hit — ~0.1ms
        }

        // 2. Cache miss — read from DB
        User user = userRepo.findById(id)
            .orElseThrow(() -> new NotFoundException("User " + id));

        // 3. Populate cache for next time
        redis.opsForValue().set(key, user, TTL);
        return user;
    }

    public User updateUser(Long id, UpdateUserRequest req) {
        User user = userRepo.save(/* update */);
        // 4. Invalidate cache after write
        redis.delete("user:" + id);
        return user;
    }
}

// ✓ Most resilient: cache failure doesn't break reads
// ✓ Only cache what's actually needed (lazy)
// ✓ Works well with read-heavy workloads
// ✗ First request after cold start or expiry has higher latency
// ✗ Risk of stale data between write and invalidation`}
      </CodeBlock>

      <CodeBlock language="java" title="Write-Through — Cache Stays in Sync">
{`// Every write goes to BOTH cache and DB synchronously
// Cache is always up to date — no stale reads

public User updateUser(Long id, UpdateUserRequest req) {
    User user = userRepo.save(buildUpdatedUser(req));

    // Write to cache immediately after DB write
    String key = "user:" + id;
    redis.opsForValue().set(key, user, Duration.ofMinutes(30));
    return user;
}

// ✓ Cache always consistent with DB
// ✓ No stale reads (great for financial data, inventory)
// ✗ Write latency = DB write + cache write (both in hot path)
// ✗ Cache fills with data that may never be read (cold data gets cached too)
// Use: banking, inventory, anything where staleness is unacceptable

// Write-Behind (Write-Back) — async DB write
// Write to cache immediately, queue DB write asynchronously
// ✓ Very fast writes (cache only in hot path)
// ✗ Data loss risk if cache fails before DB write
// ✗ Complex implementation
// Use: analytics counters, activity tracking, non-critical writes

// Read-Through — cache sits in front, handles misses
// App always reads from cache; cache fetches from DB on miss
// ✓ Transparent to application
// ✗ Cold start: all keys must warm up
// Used by: AWS ElastiCache with DAX (DynamoDB), Hibernate 2nd-level cache`}
      </CodeBlock>

      <h2>Redis Data Structures</h2>
      <p>
        Redis is not just a key-value store — it has rich data structures that map to real
        use cases. Choosing the right structure is critical for performance.
      </p>

      <CodeBlock language="bash" title="Redis Data Structures and Use Cases">
{`# STRING — most versatile, stores any value (text, JSON, binary)
SET user:1 '{"id":1,"name":"Alice"}'  EX 3600  # EX = expire in seconds
GET user:1
INCR page:views:home   # atomic counter — race-condition safe
SETNX lock:payment:123 1  EX 30  # distributed lock (SET if Not eXists)

# HASH — field-value pairs, efficient for objects
HSET user:1 name "Alice" age 30 role "admin"
HGET user:1 name          # "Alice"
HMGET user:1 name age     # ["Alice", "30"]
HINCRBY user:1 loginCount 1  # increment a field
# Use: user sessions, product data, any object with many fields
# Advantage: update one field without re-serializing the entire object

# LIST — ordered collection with head/tail operations
LPUSH queue:emails email1 email2  # push to front
RPUSH queue:emails email3         # push to back
RPOP queue:emails                 # pop from back (FIFO queue)
LRANGE queue:emails 0 -1          # get all items
LLEN queue:emails                 # length
# Use: message queues, activity feeds, recent items list

# SET — unique unordered elements
SADD user:1:interests "golang" "react" "redis"
SADD user:2:interests "react" "python" "redis"
SINTER user:1:interests user:2:interests  # ["react", "redis"] — common interests
SUNION user:1:interests user:2:interests  # all interests combined
SISMEMBER user:1:interests "react"        # 1 (true)
# Use: tags, unique visitors, friend graphs, permissions

# SORTED SET — set with scores, ordered by score
ZADD leaderboard 9500 "alice" 8200 "bob" 7800 "charlie"
ZRANK leaderboard "bob"         # 1 (0-indexed rank)
ZREVRANGE leaderboard 0 9       # top 10 players
ZINCRBY leaderboard 300 "bob"   # update score
ZRANGEBYSCORE leaderboard 8000 10000  # players with score 8000-10000
# Use: leaderboards, rate limiting (sliding window), priority queues, time-series

# HyperLogLog — probabilistic cardinality counting
PFADD daily:visitors:20240115 "user:1" "user:2" "user:1"
PFCOUNT daily:visitors:20240115   # returns ~2 (unique count)
# Use: unique visitor counts, A/B test user counting
# Memory: 12KB regardless of cardinality (vs storing every user ID)`}
      </CodeBlock>

      <h2>Cache Eviction Policies</h2>

      <CodeBlock language="bash" title="Redis Eviction Policies">
{`# Configure in redis.conf or with CONFIG SET:
CONFIG SET maxmemory 2gb
CONFIG SET maxmemory-policy allkeys-lru

# Eviction policies when memory is full:

# noeviction (default)
# → Returns error on write when memory full
# Use: when data loss is unacceptable (session store)

# allkeys-lru (most common for caching)
# → Evict least recently used key from ALL keys
# Use: general cache — let Redis figure out what's "cold"

# volatile-lru
# → Evict LRU key, but only among keys with TTL set
# Use: mix of "must keep forever" and "can evict" data

# allkeys-lfu (Redis 4.0+, often better than LRU)
# → Evict least frequently used key
# Use: when access frequency matters more than recency
# Better than LRU for social media (popular posts stay cached)

# allkeys-random
# → Evict random key
# Use: uniform access pattern (rare)

# volatile-ttl
# → Evict key with shortest remaining TTL
# Use: when you want most-expiring keys evicted first

# Rule of thumb: allkeys-lru for caches, noeviction for sessions`}
      </CodeBlock>

      <h2>Cache Invalidation Strategies</h2>

      <CodeBlock language="java" title="Cache Invalidation Patterns">
{`// PROBLEM: cache and DB can get out of sync

// Strategy 1: TTL (Time-To-Live) — simplest
// Data expires after N seconds — accept brief staleness
redis.opsForValue().set(key, value, Duration.ofMinutes(5));
// ✓ Simple, self-healing
// ✗ Stale for up to TTL duration

// Strategy 2: Delete-on-write (Cache Aside)
public void updateProduct(Product p) {
    productRepo.save(p);
    redis.delete("product:" + p.getId());     // invalidate
    redis.delete("product:list:*");           // invalidate collections too
}
// ✓ Fresh data on next read
// ✗ Cache miss storm if popular key (thundering herd)

// Strategy 3: Update-on-write (Write-Through)
public void updateProduct(Product p) {
    productRepo.save(p);
    redis.opsForValue().set("product:" + p.getId(), p, Duration.ofMinutes(30));
}
// ✓ Cache always fresh
// ✗ Write latency includes both DB and cache

// Strategy 4: Event-driven invalidation (best at scale)
// After DB write, publish event: productUpdated:{id}
// Cache service subscribes, invalidates on event
// ✓ Decoupled, works across services
// ✗ Complex, requires messaging infrastructure

// Strategy 5: Versioned keys (cache busting)
String key = "product:" + id + ":v" + product.getVersion();
// Old version key just expires naturally
// ✓ Never stale
// ✗ Cache fills with versioned entries — needs cleanup`}
      </CodeBlock>

      <h2>Distributed Caching — Redis Cluster</h2>

      <FlowChart
        title="Redis Cluster Architecture"
        chart={"graph TD\n  A[Client] --> B[Redis Cluster]\n  B --> C[Shard 1 - slots 0-5460]\n  B --> D[Shard 2 - slots 5461-10922]\n  B --> E[Shard 3 - slots 10923-16383]\n  C --> F[Primary]\n  C --> G[Replica]\n  D --> H[Primary]\n  D --> I[Replica]\n  E --> J[Primary]\n  E --> K[Replica]"}
      />

      <CodeBlock language="markdown" title="Redis High Availability Options">
{`## Standalone Redis
# Single node — simple, fast, no HA
# Use: development, non-critical caching

## Redis Sentinel
# 1 master + N replicas + 3+ sentinel processes
# Sentinels monitor master, vote on failure, promote replica
# Automatic failover: ~30 seconds
# Client must connect via sentinel, not direct
# Use: modest scale, need HA without clustering

## Redis Cluster
# Data auto-sharded across 3+ primary nodes (16384 hash slots)
# Each primary has 1+ replicas
# Automatic failover and resharding
# Horizontal scaling: add shards as data grows
# Caveat: multi-key operations require same hash slot
#   → use hash tags: {user:1}.profile and {user:1}.session
#     → both route to same shard
# Use: large-scale production, > 100GB cache

## AWS ElastiCache / Azure Cache for Redis
# Managed Redis — no ops, automatic backups, multi-AZ
# ElastiCache Serverless: auto-scales with zero config
# Use: almost always prefer managed in cloud deployments`}
      </CodeBlock>

      <h2>CDN as Cache Layer</h2>

      <CodeBlock language="markdown" title="Caching at Every Layer">
{`## Layer 1: Browser Cache
# Cache-Control: max-age=3600 → browser caches for 1 hour
# ETag + If-None-Match → conditional requests (304 Not Modified)
# Cache-Control: no-store → never cache (login pages, API responses)

## Layer 2: CDN (Cloudflare, CloudFront, Fastly)
# Cache static assets globally: JS, CSS, images, videos
# Cache public API responses with Cache-Control headers
# 99%+ cache hit rate for popular content → near-zero origin load
# Cache invalidation: purge API or use content-hashed filenames

## Layer 3: Load Balancer / Reverse Proxy
# Nginx: proxy_cache (file-based cache)
# Varnish: high-performance HTTP cache
# Cache whole page responses (full-page caching)
# Use: news sites, blogs, marketing pages

## Layer 4: Application Cache (Redis/Memcached)
# Cache computed results, DB query results, session data
# This is what most backend services need

## Layer 5: Database Buffer Pool
# PostgreSQL: shared_buffers (keep hot data in RAM)
# MySQL InnoDB: innodb_buffer_pool_size
# Set to 25-80% of available RAM
# This is "free" caching — happens automatically

## Key Metric: Cache Hit Rate
# Hit rate < 80%: you're not caching the right things
# Hit rate > 95%: healthy cache — check TTL isn't too short
# Monitor: cache misses, eviction rate, memory usage`}
      </CodeBlock>

      <InfoBox variant="warning" title="Cache Stampede (Thundering Herd)">
        <p>
          When a hot cache key expires simultaneously for many users, they all miss and hammer
          the database at once. Solutions: (1) <strong>Mutex/lock</strong> — one request regenerates,
          others wait or return stale data. (2) <strong>Jitter on TTL</strong> — add random ±10% to
          expiry so related keys don't expire together. (3) <strong>Probabilistic Early Expiration
          (XFetch)</strong> — randomly refresh the cache slightly before expiry, with probability
          proportional to computation cost. (4) <strong>Background refresh</strong> — a cron job or
          event refreshes cache before it expires.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Your social media app stores user profile data. Which caching strategy is best?"
        options={[
          "Write-through — always keep cache in sync with every profile update",
          "Cache-aside with TTL — load on demand, expire after 30 minutes",
          "No caching — profiles change too often",
          "Write-behind — write to cache first, async to database"
        ]}
        correctIndex={1}
        explanation="Cache-aside with TTL is ideal here. Most profiles are read far more than written (high read:write ratio). Loading on demand (lazy) means you only cache profiles that are actually viewed. A 30-minute TTL means slightly stale data is acceptable (fine for social media) and self-heals automatically. Write-through would add write latency and cache every profile even cold ones. Write-behind risks data loss."
      />

      <InteractiveChallenge
        question="What is the main advantage of Redis Sorted Sets for a leaderboard?"
        options={[
          "They are stored on disk, so they persist after restart",
          "They maintain elements sorted by score with O(log N) insertions and range queries",
          "They automatically expire old entries",
          "They support full-text search on member names"
        ]}
        correctIndex={1}
        explanation="Redis Sorted Sets maintain a sorted order by score using a skip list + hash map. This gives O(log N) for inserts and updates, and O(log N + M) for range queries. For a leaderboard: ZADD leaderboard 9500 'alice' adds or updates a score, ZREVRANGE leaderboard 0 9 returns the top 10 — all blazing fast regardless of leaderboard size. No SQL ORDER BY + LIMIT can match this at high concurrent write rates."
      />
    </LessonLayout>
  );
}
