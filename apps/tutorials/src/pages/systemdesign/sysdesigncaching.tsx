import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SysdesignCaching() {
  return (
    <LessonLayout
      title="Caching Strategies"
      sectionId="systemdesign"
      lessonIndex={2}
      prev={{ path: "/systemdesign/scaling", label: "Scaling Patterns" }}
      next={{ path: "/systemdesign/databases", label: "Database Design" }}
    >
      <p>Caching stores the result of expensive operations so future requests can be served faster. The key decisions: what to cache, where (client, CDN, application, database), how long (TTL), and how to invalidate stale data.</p>
      <FlowChart title="Cache Hierarchy" chart={"graph LR\n  A[Client] --> B[Browser Cache]\n  B --> C[CDN]\n  C --> D[API Gateway Cache]\n  D --> E[App-Level Cache Redis]\n  E --> F[Database Query Cache]\n  F --> G[Database]"} />
      <CodeBlock language="java" title="Caching Patterns">
{`// CACHE-ASIDE (Lazy Loading) — most common
public Product getProduct(String id) {
    Product cached = cache.get("product:" + id);
    if (cached != null) return cached;        // cache hit
    Product product = db.findById(id);        // cache miss — load from DB
    cache.set("product:" + id, product, 300); // store with 5-min TTL
    return product;
}

// WRITE-THROUGH — update cache and DB together
public Product updateProduct(String id, Product updated) {
    Product saved = db.save(updated);
    cache.set("product:" + id, saved, 300);   // keep cache in sync
    return saved;
}

// WRITE-BEHIND (Write-Back) — write to cache, async to DB (risk of data loss)
// Good for: high-write scenarios where some loss is acceptable

// READ-THROUGH — cache sits in front of DB, handles misses itself
// Used by: AWS ElastiCache DAX (DynamoDB Accelerator)

// CACHE INVALIDATION strategies
// 1. TTL-based: just expire after N seconds (simple, eventually consistent)
// 2. Event-based: delete/update cache when data changes
cache.delete("product:" + id);  // on product update

// 3. Cache stampede prevention (many threads miss at same time)
public Product getWithLock(String id) {
    Product cached = cache.get("product:" + id);
    if (cached != null) return cached;
    // Only ONE thread rebuilds the cache
    if (lock.tryLock("product-lock:" + id, Duration.ofSeconds(5))) {
        try {
            // Double-check after acquiring lock
            cached = cache.get("product:" + id);
            if (cached != null) return cached;
            Product p = db.findById(id);
            cache.set("product:" + id, p, 300);
            return p;
        } finally { lock.unlock("product-lock:" + id); }
    }
    return db.findById(id); // fallback if lock not acquired
}`}
      </CodeBlock>
      <InteractiveChallenge
        question="What is cache invalidation and why is it considered one of the hardest problems in computer science?"
        options={["Deleting the cache server", "Keeping the cache consistent with the source of truth — deciding when cached data is stale and must be refreshed", "Encrypting cache data", "Setting cache TTLs"]}
        correctIndex={1}
        explanation="Cache invalidation is determining when to remove or update cached data so clients don't see stale results. It's hard because: immediate invalidation breaks availability, TTL-based invalidation means temporary staleness, event-based invalidation requires perfect coordination between writers and the cache, and distributed caches have race conditions."
      />

    </LessonLayout>
  );
}
