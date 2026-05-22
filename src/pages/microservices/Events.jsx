import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function MicroservicesEvents() {
  return (
    <LessonLayout
      title="Event-Driven Architecture"
      sectionId="microservices"
      lessonIndex={5}
      prev={{ path: "/microservices/scaling", label: "Scaling Strategies" }}
      next={{ path: "/microservices/containers", label: "Containers and Docker" }}
    >
      <p>Event-Driven Architecture (EDA) uses events to trigger and communicate between decoupled services. An event is an immutable record that something happened. Services publish events; other services subscribe and react independently.</p>

      <h2>Event Sourcing</h2>

      <CodeBlock language="java" title="Event Sourcing — State from Events">
{`// Instead of storing current state, store the sequence of events
// Current state is derived by replaying events

public sealed interface AccountEvent permits
    AccountOpened, MoneyDeposited, MoneyWithdrawn, AccountClosed {}

public record AccountOpened(String accountId, String ownerId, Instant at) implements AccountEvent {}
public record MoneyDeposited(String accountId, BigDecimal amount, String ref, Instant at) implements AccountEvent {}
public record MoneyWithdrawn(String accountId, BigDecimal amount, String ref, Instant at) implements AccountEvent {}

// Aggregate rebuilds state by replaying events
public class BankAccount {
    private String id;
    private BigDecimal balance = BigDecimal.ZERO;
    private AccountStatus status;

    public static BankAccount reconstitute(List<AccountEvent> events) {
        BankAccount account = new BankAccount();
        events.forEach(account::apply);
        return account;
    }

    private void apply(AccountEvent event) {
        switch (event) {
            case AccountOpened e   -> { this.id = e.accountId(); this.status = ACTIVE; }
            case MoneyDeposited e  -> this.balance = balance.add(e.amount());
            case MoneyWithdrawn e  -> this.balance = balance.subtract(e.amount());
            case AccountClosed e   -> this.status = CLOSED;
        }
    }

    // Business logic appends new events
    public List<AccountEvent> withdraw(BigDecimal amount) {
        if (balance.compareTo(amount) < 0) throw new InsufficientFundsException();
        return List.of(new MoneyWithdrawn(id, amount, UUID.randomUUID().toString(), Instant.now()));
    }
}`}
      </CodeBlock>

      <FlowChart
        title="Event-Driven Flow"
        chart={"graph LR\n  A[Order Service] -- OrderPlaced --> B[Event Bus]\n  B --> C[Notification Service]\n  B --> D[Inventory Service]\n  B --> E[Analytics Service]\n  B --> F[Shipping Service]"}
      />

      <CodeBlock language="java" title="Outbox Pattern — Guaranteed Event Publishing">
{`// Problem: Save to DB and publish event — what if publish fails?
// Solution: Outbox pattern — write event to same DB transaction, poll and publish

@Service
@Transactional
public class OrderService {
    private final OrderRepository orderRepo;
    private final OutboxRepository outboxRepo;

    public Order placeOrder(CreateOrderRequest req) {
        Order order = new Order(req);
        orderRepo.save(order);

        // Write event to outbox table in SAME transaction — atomic!
        OutboxMessage msg = OutboxMessage.of(
            "order-events",
            order.getId().toString(),
            new OrderPlacedEvent(order)
        );
        outboxRepo.save(msg);  // if this transaction commits, event WILL be published

        return order;
    }
}

// Separate process polls outbox and publishes to Kafka
@Scheduled(fixedDelay = 1000)
public void processOutbox() {
    List<OutboxMessage> pending = outboxRepo.findByPublishedFalse();
    pending.forEach(msg -> {
        kafka.send(msg.getTopic(), msg.getKey(), msg.getPayload());
        msg.setPublished(true);
        outboxRepo.save(msg);
    });
}`}
      </CodeBlock>

      <InfoBox variant="note" title="At-Least-Once vs Exactly-Once">
        <p>Most messaging systems provide at-least-once delivery — your message will arrive, but possibly more than once. Design for idempotency: store processed event IDs and skip duplicates. True exactly-once delivery is extremely complex and often unnecessary if consumers are idempotent.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What problem does the Outbox pattern solve?"
        options={["It speeds up event publishing by batching messages", "It guarantees atomic consistency between database saves and event publishing", "It prevents duplicate events from being consumed", "It reduces the number of Kafka partitions needed"]}
        correctIndex={1}
        explanation="The Outbox pattern solves the dual-write problem: you must write to the database AND publish an event, but these are two separate systems that cannot participate in the same transaction. The Outbox writes the event to a database table in the same transaction as the business data — guaranteed to commit together — then a separate process publishes it to Kafka."
      />

    </LessonLayout>
  );
}
