import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function MicroservicesData() {
  return (
    <LessonLayout
      title="Data Management"
      sectionId="microservices"
      lessonIndex={3}
      prev={{ path: "/microservices/communication", label: "Communication Patterns" }}
      next={{ path: "/microservices/scaling", label: "Scaling Strategies" }}
    >
      <p>Managing data in microservices is fundamentally different from monoliths. Each service owns its database — no shared tables, no cross-service JOINs. This requires new patterns for data consistency and cross-service queries.</p>

      <h2>Database-per-Service</h2>

      <CodeBlock language="yaml" title="Each Service Has Its Own Database">
{`# User Service — PostgreSQL (relational, user profiles)
user-service:
  datasource:
    url: jdbc:postgresql://users-db:5432/users
    username: user_svc
    password: ${USER_DB_PASSWORD}

# Product Service — MongoDB (document, flexible catalog)
product-service:
  data:
    mongodb:
      uri: mongodb://products-db:27017/products

# Session Service — Redis (key-value, fast session lookup)
session-service:
  redis:
    host: sessions-redis
    port: 6379

# Analytics Service — ClickHouse (columnar, read-heavy OLAP)
analytics-service:
  datasource:
    url: jdbc:clickhouse://analytics-db:8123/events`}
      </CodeBlock>

      <h2>Event-Driven Data Sync</h2>

      <CodeBlock language="java" title="Maintaining Read Models via Events">
{`// Problem: Order service needs user name for order display
// Can't JOIN across databases — use a local read model

// Order service maintains a local copy of user data it needs
@Entity
@Table(name = "user_snapshots")  // local read model
public class UserSnapshot {
    @Id private Long userId;
    private String displayName;
    private String email;
    private Instant updatedAt;
}

// Listen for user changes and update local copy
@Component
public class UserSnapshotUpdater {
    private final UserSnapshotRepository repo;

    @KafkaListener(topics = "user-events")
    public void onUserUpdated(UserUpdatedEvent event) {
        UserSnapshot snap = repo.findById(event.getUserId())
            .orElse(new UserSnapshot());
        snap.setUserId(event.getUserId());
        snap.setDisplayName(event.getDisplayName());
        snap.setEmail(event.getEmail());
        snap.setUpdatedAt(Instant.now());
        repo.save(snap);
    }
}

// Now Order service can join locally without calling User service
@Query("SELECT o, u FROM Order o JOIN UserSnapshot u ON o.userId = u.userId")
List<OrderWithUserDto> findOrdersWithUserInfo();`}
      </CodeBlock>

      <FlowChart
        title="Data Consistency Approaches"
        chart={"graph TD\n  A[Need consistent data?] --> B{Strong consistency required?}\n  B -- Yes --> C[Two-Phase Commit]\n  C --> D[High complexity - avoid]\n  B -- No --> E[Eventual Consistency]\n  E --> F[Saga Pattern]\n  E --> G[Event-Driven Sync]\n  E --> H[CQRS Read Models]"}
      />

      <InfoBox variant="warning" title="No Distributed Transactions">
        <p>Avoid distributed transactions (2PC) across microservices — they create tight coupling, reduce availability (both services must be up), and are very hard to implement correctly. Use the Saga pattern instead: a sequence of local transactions, each publishing events, with compensating transactions for rollback.</p>
      </InfoBox>

      <InteractiveChallenge
        question="How does a microservice get data from another service's domain without cross-database JOINs?"
        options={["It queries the other service's database directly using a shared read-only user", "It calls the other service's API or maintains a local read model synchronized via events", "It uses a global cache that all services write to", "It waits for a nightly ETL job to copy data"]}
        correctIndex={1}
        explanation="Services either call each other's APIs for real-time data, or maintain a local read model (a snapshot/projection of another service's data) kept up to date via events. The local read model approach avoids synchronous coupling and provides fast local queries."
      />

    </LessonLayout>
  );
}
