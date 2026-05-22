import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SysDistributed() {
  return (
    <LessonLayout
      title="Distributed Systems"
      sectionId="systemdesign"
      lessonIndex={4}
      prev={{ path: "/systemdesign/databases", label: "Databases" }}
      next={{ path: "/systemdesign/messaging", label: "Messaging" }}
    >
      <p>
        Distributed systems are multiple independent computers working together to appear as a
        single coherent system. The fundamental challenge: machines fail, networks partition,
        and clocks drift — yet users expect consistent, available, and fast responses. This
        lesson covers the theoretical foundations (CAP, PACELC), consensus algorithms (Raft),
        distributed transactions, and the coordination primitives that underpin every large-scale system.
      </p>

      <h2>CAP Theorem — Deep Dive</h2>
      <p>
        Eric Brewer's CAP theorem states that a distributed data store can only guarantee two
        of three properties simultaneously: <strong>Consistency</strong>, <strong>Availability</strong>,
        and <strong>Partition Tolerance</strong>. But the nuance matters: network partitions
        are not optional — they happen in any real distributed system. So the real choice is:
        during a partition, do you sacrifice consistency or availability?
      </p>

      <FlowChart
        title="CAP Theorem — Trade-Off Triangle"
        chart={"graph TD\n  A[CAP Theorem] --> B[CP: Consistency + Partition Tolerance]\n  A --> C[AP: Availability + Partition Tolerance]\n  B --> D[HBase, Zookeeper, etcd, CockroachDB]\n  B --> E[Returns error during partition]\n  C --> F[Cassandra, DynamoDB, CouchDB]\n  C --> G[Returns possibly stale data during partition]"}
      />

      <CodeBlock language="java" title="CAP Theorem — Concrete Examples">
{`// CP SYSTEM BEHAVIOR (e.g., ZooKeeper, etcd)
// During a network partition, the minority partition refuses writes.
// ZooKeeper requires a quorum (majority) to process writes.
// If 3 of 5 nodes are reachable, writes succeed. If only 2 are reachable,
// writes are REJECTED (returns error) to avoid inconsistency.

// ZooKeeper ephemeral node for leader election:
ZooKeeper zk = new ZooKeeper("zk-host:2181", 3000, watchedEvent -> {});
// Create ephemeral sequential node — lowest sequence number = leader
String path = zk.create("/election/node-",
    nodeId.getBytes(),
    ZooDefs.Ids.OPEN_ACL_UNSAFE,
    CreateMode.EPHEMERAL_SEQUENTIAL);
// Ephemeral = auto-deleted when session dies (failure detection built-in)

// ─────────────────────────────────────────────────────────────────

// AP SYSTEM BEHAVIOR (e.g., Cassandra with quorum < majority)
// During a partition, ALL nodes accept writes (availability preserved).
// Conflicting writes are resolved later via "last-write-wins" or CRDTs.
// Cassandra consistency levels:
//   ONE:    fastest; 1 replica must respond; may return stale data
//   QUORUM: ceil(RF/2+1) replicas must respond; good balance
//   ALL:    all replicas must respond; strong consistency; low availability

// Cassandra write with tunable consistency:
try (CqlSession session = CqlSession.builder().build()) {
    SimpleStatement stmt = SimpleStatement.builder(
        "INSERT INTO users (id, email) VALUES (?, ?)")
        .setConsistencyLevel(ConsistencyLevel.QUORUM) // tune here
        .build();
    session.execute(stmt.bind(userId, email));
}

// ── PACELC EXTENSION TO CAP ───────────────────────────────────────
// CAP only describes partition scenarios. PACELC adds:
// "Even when there is No partition (E), there is a trade-off between
//  Latency (L) and Consistency (C)"
//
// System choices:
// PA/EL: DynamoDB (default), Cassandra — sacrifice consistency for low latency always
// PC/EC: VoltDB, Spanner — always consistent, higher latency
// PA/EC: MongoDB (default write concern = 1, but can tune)
// PC/EL: not really possible (low latency AND strong consistency = hard)

// Real implication: Spanner uses GPS clocks and atomic clocks to achieve
// "external consistency" (linearizability) globally, but write latency
// is ~5-14ms because it must do Paxos across data centers.`}
      </CodeBlock>

      <h2>Consensus — The Raft Algorithm</h2>
      <p>
        Consensus algorithms ensure all nodes in a distributed system agree on a single value
        (e.g., who the leader is, what the next log entry is). Raft is the most understandable
        consensus algorithm and underpins etcd, CockroachDB, TiKV, and many others.
      </p>

      <InfoBox variant="note" title="Raft in Plain English">
        <p>
          Raft works through <strong>leader election</strong> and <strong>log replication</strong>:
        </p>
        <ol>
          <li>
            <strong>Leader Election:</strong> All nodes start as Followers. If a Follower receives
            no heartbeat within an election timeout (150–300ms, randomized), it becomes a Candidate
            and requests votes. The first Candidate to receive a majority of votes becomes Leader.
            A new election term begins each time.
          </li>
          <li>
            <strong>Log Replication:</strong> All client writes go to the Leader. The Leader appends
            the entry to its log and replicates it to all Followers via AppendEntries RPCs. Once a
            majority of nodes confirm the entry is in their log, the Leader commits it and responds
            to the client.
          </li>
          <li>
            <strong>Safety:</strong> A Candidate can only win an election if its log is at least as
            up-to-date as any other node that could vote — preventing a node with stale data from
            becoming leader and overwriting committed entries.
          </li>
        </ol>
        <p>
          Raft guarantees: at most one leader per term, committed entries are never lost, and all
          committed entries are eventually present on all nodes.
        </p>
      </InfoBox>

      <CodeBlock language="python" title="Raft Leader Election — State Machine Logic">
{`import threading, time, random

class RaftNode:
    FOLLOWER  = "follower"
    CANDIDATE = "candidate"
    LEADER    = "leader"

    def __init__(self, node_id, peers):
        self.id            = node_id
        self.peers         = peers          # list of RaftNode
        self.state         = self.FOLLOWER
        self.current_term  = 0
        self.voted_for     = None           # candidate we voted for in current term
        self.log           = []             # (term, command) entries
        self.commit_index  = -1
        self.last_heartbeat = time.time()
        self.election_timeout = random.uniform(0.15, 0.30)  # 150–300ms, randomized

    def run(self):
        while True:
            if self.state == self.FOLLOWER:
                # If no heartbeat received within timeout, start election
                if time.time() - self.last_heartbeat > self.election_timeout:
                    self.start_election()
            elif self.state == self.LEADER:
                self.send_heartbeats()
                time.sleep(0.05)  # heartbeat every 50ms

    def start_election(self):
        self.current_term += 1
        self.state = self.CANDIDATE
        self.voted_for = self.id  # vote for ourselves
        votes = 1  # count our own vote
        print(f"[{self.id}] Starting election for term {self.current_term}")

        for peer in self.peers:
            if peer.request_vote(self.current_term, self.id,
                                 len(self.log) - 1,
                                 self.log[-1][0] if self.log else 0):
                votes += 1

        majority = (len(self.peers) + 1) // 2 + 1
        if votes >= majority:
            print(f"[{self.id}] Elected leader for term {self.current_term}")
            self.state = self.LEADER
        else:
            self.state = self.FOLLOWER  # lost election, back to follower

    def request_vote(self, term, candidate_id, last_log_index, last_log_term):
        # Reject if we've seen a higher term
        if term < self.current_term:
            return False
        if term > self.current_term:
            self.current_term = term
            self.state = self.FOLLOWER
            self.voted_for = None

        # Grant vote only if we haven't voted this term and candidate's log
        # is at least as up-to-date as ours (prevents stale leaders)
        if self.voted_for is None or self.voted_for == candidate_id:
            my_last_term = self.log[-1][0] if self.log else 0
            candidate_log_ok = (last_log_term > my_last_term or
                (last_log_term == my_last_term and last_log_index >= len(self.log) - 1))
            if candidate_log_ok:
                self.voted_for = candidate_id
                self.last_heartbeat = time.time()  # reset election timer
                return True
        return False

    def send_heartbeats(self):
        for peer in self.peers:
            peer.append_entries(self.current_term, self.id, [], self.commit_index)

    def append_entries(self, term, leader_id, entries, leader_commit):
        if term < self.current_term:
            return False
        self.last_heartbeat = time.time()
        self.state = self.FOLLOWER
        self.current_term = term
        # Append new log entries, update commit index...
        return True`}
      </CodeBlock>

      <h2>Distributed Transactions</h2>

      <CodeBlock language="java" title="Two-Phase Commit (2PC) and Its Limitations">
{`// TWO-PHASE COMMIT (2PC)
// Coordinator asks all participants to prepare (Phase 1).
// If ALL vote Yes, coordinator sends commit (Phase 2).
// If ANY vote No or timeout, coordinator sends rollback.
//
// Problem: The coordinator is a single point of failure.
// If coordinator crashes between Phase 1 and Phase 2, participants
// are stuck in "prepared" state (holding locks) indefinitely.
// This is called the "in-doubt" problem.

// Phase 1: Prepare
@Transactional
public void transferFunds(String fromAccount, String toAccount, BigDecimal amount) {
    // Coordinator contacts both services
    boolean debitReady  = accountService.prepare(fromAccount, amount, "DEBIT");
    boolean creditReady = accountService.prepare(toAccount, amount, "CREDIT");

    if (debitReady && creditReady) {
        // Phase 2: Commit
        accountService.commit(fromAccount);
        accountService.commit(toAccount);
    } else {
        // Phase 2: Rollback
        accountService.rollback(fromAccount);
        accountService.rollback(toAccount);
        throw new TransactionFailedException("Transfer failed");
    }
}
// Drawback: Participants hold locks during network round trips — hurts throughput.
// 2PC is used in: XA transactions, Google Spanner's TrueTime-based 2PC.

// ──────────────────────────────────────────────────────────────────
// SAGA PATTERN — preferred for microservices
// Break a distributed transaction into a sequence of LOCAL transactions.
// Each step publishes an event. On failure, execute compensating transactions.

// CHOREOGRAPHY SAGA (event-driven — no central coordinator)
@Service
public class OrderSaga {
    // Step 1: Create order
    @EventHandler
    public void onOrderCreated(OrderCreatedEvent e) {
        inventoryService.reserveItems(e.getOrderId(), e.getItems());
        // publishes: InventoryReservedEvent or InventoryFailedEvent
    }

    // Step 2: Reserve inventory
    @EventHandler
    public void onInventoryReserved(InventoryReservedEvent e) {
        paymentService.chargeCard(e.getOrderId(), e.getTotalAmount());
        // publishes: PaymentSucceededEvent or PaymentFailedEvent
    }

    // Step 3: Handle payment failure — compensate previous steps
    @EventHandler
    public void onPaymentFailed(PaymentFailedEvent e) {
        inventoryService.releaseReservation(e.getOrderId()); // compensating txn
        orderService.cancelOrder(e.getOrderId());            // compensating txn
        notificationService.notifyUser(e.getUserId(), "Payment failed");
    }
}

// ORCHESTRATION SAGA (central orchestrator — easier to trace and debug)
@Service
public class OrderSagaOrchestrator {
    public void execute(CreateOrderCommand cmd) {
        try {
            Order order = orderService.createOrder(cmd);        // step 1
            inventoryService.reserveItems(order.getId(), cmd);  // step 2
            paymentService.charge(order.getId(), cmd);          // step 3
            shippingService.scheduleShipment(order.getId());    // step 4
        } catch (PaymentException e) {
            inventoryService.release(cmd.getOrderId());         // compensate
            orderService.cancel(cmd.getOrderId());              // compensate
        }
    }
}`}
      </CodeBlock>

      <h2>Vector Clocks and Causality</h2>

      <CodeBlock language="python" title="Vector Clocks — Tracking Causality in Distributed Systems">
{`# PROBLEM: Distributed systems have no global clock.
# Physical clocks drift; NTP has ~100ms accuracy.
# Without ordering, you can't determine which of two events happened first.
#
# LAMPORT TIMESTAMPS: simple scalar counter — can only determine causal order
# VECTOR CLOCKS: per-node counters — can determine concurrent vs causal events

class VectorClock:
    def __init__(self, node_id: str, all_nodes: list[str]):
        self.node_id = node_id
        self.clock = {n: 0 for n in all_nodes}

    def tick(self):
        """Increment own counter on a local event."""
        self.clock[self.node_id] += 1
        return dict(self.clock)

    def send(self):
        """Increment own counter before sending a message."""
        self.clock[self.node_id] += 1
        return dict(self.clock)  # attach this to the message

    def receive(self, incoming_clock: dict):
        """On receiving a message, take max of each component, then increment own."""
        for node, ts in incoming_clock.items():
            self.clock[node] = max(self.clock.get(node, 0), ts)
        self.clock[self.node_id] += 1

    def happens_before(self, vc_a: dict, vc_b: dict) -> bool:
        """True if vc_a happened before vc_b (vc_a causally precedes vc_b)."""
        return (all(vc_a.get(n, 0) <= vc_b.get(n, 0) for n in set(vc_a) | set(vc_b))
                and any(vc_a.get(n, 0) < vc_b.get(n, 0) for n in set(vc_a) | set(vc_b)))

    def concurrent(self, vc_a: dict, vc_b: dict) -> bool:
        """True if neither happened before the other — a CONFLICT."""
        return (not self.happens_before(vc_a, vc_b) and
                not self.happens_before(vc_b, vc_a))

# Example: Amazon Dynamo uses vector clocks for conflict detection.
# DynamoDB exposes conflicts to the application for resolution.
# Git uses a DAG (directed acyclic graph) to represent causal history —
# a merge commit resolves concurrent branches.

# PRACTICAL USE: Version vectors in DynamoDB
# Each item has a "causality token" (version vector).
# Concurrent writes create siblings — application must resolve.`}
      </CodeBlock>

      <h2>Gossip Protocol and Failure Detection</h2>

      <FlowChart
        title="Gossip Protocol — Information Propagation"
        chart={"graph LR\n  A[Node A knows X] -- tells --> B[Node B]\n  B -- tells --> C[Node C]\n  B -- tells --> D[Node D]\n  C -- tells --> E[Node E]\n  D -- tells --> E\n  E -- tells --> F[All nodes know X within log N rounds]"}
      />

      <CodeBlock language="python" title="Gossip Protocol and Leader Election">
{`# GOSSIP PROTOCOL
# Each node periodically picks K random peers and exchanges state.
# Information propagates in O(log N) rounds to reach all N nodes.
# Used by: Cassandra (cluster membership, schema updates),
#          Consul (service mesh), SWIM protocol (failure detection)

import random, time, threading

class GossipNode:
    def __init__(self, node_id, peers):
        self.id = node_id
        self.state = {node_id: {"alive": True, "version": 0}}
        self.peers = peers  # list of GossipNode

    def gossip_round(self):
        """Periodically executed — pick random peer and exchange state."""
        while True:
            time.sleep(1)  # gossip interval
            if self.peers:
                target = random.choice(self.peers)
                # Send our state, receive their state
                their_state = target.handle_gossip(self.state)
                self.merge(their_state)

    def handle_gossip(self, incoming_state):
        self.merge(incoming_state)
        return self.state  # respond with our full state

    def merge(self, other_state):
        for node_id, info in other_state.items():
            if node_id not in self.state:
                self.state[node_id] = info
            elif info["version"] > self.state[node_id]["version"]:
                self.state[node_id] = info  # take higher version

    def mark_failed(self, node_id):
        """Heartbeat timeout — mark node as suspected failed."""
        if node_id in self.state:
            self.state[node_id]["alive"] = False
            self.state[node_id]["version"] += 1
        # Gossip will propagate this to all nodes within O(log N) rounds

# ── SPLIT BRAIN PROBLEM ───────────────────────────────────────────
# Network partition creates two isolated groups, each thinking it's the
# majority and electing its own leader. Both leaders accept writes.
# When partition heals, you have two conflicting "sources of truth".
#
# Prevention strategies:
# 1. Quorum: only allow writes if you have majority of votes (Raft does this)
# 2. STONITH (Shoot The Other Node In The Head): isolated node fences itself
#    off (shuts down) to prevent split-brain in database clusters
# 3. Epoch fencing: old leader detects higher epoch from new leader and
#    stops accepting writes (used by Kafka leader election)

# ── PAXOS vs RAFT ────────────────────────────────────────────────
# Paxos: original consensus algorithm (Lamport 1989). Correct but complex.
#   Multi-Paxos (for log replication) requires significant engineering.
#   Used by: Google Chubby, Google Spanner.
# Raft: designed for understandability (Ongaro 2014). Equivalent safety.
#   Clear leader structure, well-defined log replication.
#   Used by: etcd, CockroachDB, TiKV, Consul, RethinkDB.
#
# Key difference: Paxos allows any node to propose in any phase (more
# complex to reason about). Raft routes all proposals through the Leader
# (simpler, but leader is a bottleneck for write throughput).`}
      </CodeBlock>

      <h2>Idempotency and At-Least-Once Delivery</h2>

      <InfoBox variant="warning" title="The At-Least-Once Problem">
        <p>
          In any distributed system, networks are unreliable. When a client sends a request and
          receives no response (timeout), it cannot distinguish between:
        </p>
        <ul>
          <li>The request was never received by the server</li>
          <li>The server processed it but the response was lost</li>
          <li>The server is still processing</li>
        </ul>
        <p>
          Safe retry behavior requires <strong>idempotency</strong>: processing the same request
          multiple times has the same effect as processing it once. This is a design requirement,
          not an optimization.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Idempotency Keys — Safe Distributed Retries">
{`// Idempotency key pattern: client generates a UUID for each logical operation.
// Server stores the result keyed by idempotency key.
// On retry, server returns the cached result without re-processing.

@RestController
public class PaymentController {
    private final RedisTemplate<String, PaymentResult> redis;
    private final PaymentService paymentService;

    @PostMapping("/api/v1/payments")
    public ResponseEntity<PaymentResult> charge(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody ChargeRequest request) {

        String cacheKey = "idempotency:payment:" + idempotencyKey;

        // 1. Check if we already processed this key
        PaymentResult existing = redis.opsForValue().get(cacheKey);
        if (existing != null) {
            return ResponseEntity.ok()
                .header("Idempotency-Replayed", "true")
                .body(existing);
        }

        // 2. Acquire a lock to prevent concurrent duplicates
        String lockKey = "lock:payment:" + idempotencyKey;
        Boolean locked = redis.opsForValue().setIfAbsent(lockKey, "1",
            Duration.ofSeconds(30));
        if (!Boolean.TRUE.equals(locked)) {
            throw new ConflictException("Concurrent request with same idempotency key");
        }

        try {
            // 3. Process the payment
            PaymentResult result = paymentService.charge(request);

            // 4. Store result — client can safely retry and get same result
            redis.opsForValue().set(cacheKey, result, Duration.ofDays(1));
            return ResponseEntity.ok(result);

        } finally {
            redis.delete(lockKey);
        }
    }
}

// Client-side: always set Idempotency-Key header on non-idempotent requests
// Retry policy with exponential backoff:
public <T> T retryWithBackoff(Supplier<T> fn, int maxRetries) {
    for (int attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return fn.get();
        } catch (RetryableException e) {
            if (attempt == maxRetries) throw e;
            long delay = (long) Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms...
            delay += ThreadLocalRandom.current().nextLong(50); // jitter
            Thread.sleep(delay);
        }
    }
    throw new IllegalStateException("unreachable");
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="The CAP theorem says you can only have two of: Consistency, Availability, and Partition Tolerance. In practice, why is 'CA' (Consistency + Availability, no partition tolerance) not a real option for distributed systems?"
        options={[
          "Because CA systems are too expensive to build",
          "Because network partitions are inevitable in any real multi-node system — you cannot opt out of handling them, so the real choice is between C and A during a partition",
          "Because consistency and availability are mutually exclusive by definition",
          "Because CA systems require too many servers"
        ]}
        correctIndex={1}
        explanation={"Network partitions — where nodes cannot communicate — are not optional in any distributed system. Hardware fails, cables are cut, switches crash, and cloud availability zones lose connectivity. You cannot choose to 'not handle partitions'; you must decide what to do when they occur. The real choice is: during a partition, do you serve requests with possibly stale data (AP) or reject requests to avoid inconsistency (CP)? A single-node database is 'CA' but the moment you add a replica, you are a distributed system subject to CAP."}
      />

      <InteractiveChallenge
        question="What is the key advantage of the Saga pattern over Two-Phase Commit (2PC) for distributed transactions across microservices?"
        options={[
          "Sagas guarantee stronger ACID properties than 2PC",
          "Sagas are faster to implement than 2PC",
          "Sagas use local transactions without holding distributed locks across services, making them more resilient to failures and avoiding the in-doubt/blocking problem of 2PC",
          "Sagas require fewer network round-trips than 2PC"
        ]}
        correctIndex={2}
        explanation={"2PC requires all participants to hold locks during two network round trips, and if the coordinator crashes between phases, participants are stuck in 'prepared' state indefinitely (the in-doubt problem). Sagas decompose a distributed transaction into a sequence of local transactions, each committed independently. On failure, compensating transactions undo previous steps. There are no distributed locks, no blocking, and failure recovery is handled through compensations. The trade-off: Sagas provide eventual consistency (not atomicity), and compensations are application-specific logic that must be carefully designed."}
      />
    </LessonLayout>
  );
}
