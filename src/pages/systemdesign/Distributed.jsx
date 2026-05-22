import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Distributed() {
  return (
    <LessonLayout
      title="Distributed Systems"
      sectionId="systemdesign"
      lessonIndex={4}
      prev={{ path: '/systemdesign/databases', label: 'Database Design &amp; Scaling' }}
      next={{ path: '/systemdesign/messaging', label: 'Message Queues &amp; Streaming' }}
    >
      {/* ===== Section 1: CAP Theorem Deep Dive ===== */}
      <h2>CAP Theorem Deep Dive</h2>
      <p>
        The CAP theorem, formulated by Eric Brewer, states that a distributed data store
        can only guarantee two of the following three properties simultaneously:
      </p>
      <ul>
        <li>
          <strong>Consistency (C):</strong> Every read receives the most recent write or an
          error. All nodes see the same data at the same time. This is linearizability &mdash;
          once a write completes, all subsequent reads must reflect that write.
        </li>
        <li>
          <strong>Availability (A):</strong> Every request receives a non-error response,
          without the guarantee that it contains the most recent write. The system remains
          operational and responsive even when some nodes are down.
        </li>
        <li>
          <strong>Partition Tolerance (P):</strong> The system continues to operate despite
          arbitrary message loss or failure of part of the network. Network partitions are
          inevitable in distributed systems, so you must always tolerate them.
        </li>
      </ul>
      <p>
        Since network partitions are unavoidable in practice, the real choice is between
        consistency and availability when a partition occurs. This is the fundamental
        trade-off every distributed system must make.
      </p>

      <h3>Real-World CAP Classifications</h3>
      <p>
        <strong>CP Systems</strong> (Consistency + Partition Tolerance): These systems
        sacrifice availability during partitions to maintain consistency.
      </p>
      <ul>
        <li><strong>MongoDB</strong> &mdash; Uses a primary node for writes; during a partition, minority partitions become unavailable.</li>
        <li><strong>HBase</strong> &mdash; Strong consistency via a single RegionServer per region; unavailable if that server is partitioned.</li>
        <li><strong>Redis Cluster</strong> &mdash; In cluster mode, favors consistency; partitioned minority nodes reject writes.</li>
        <li><strong>ZooKeeper</strong> &mdash; Uses Zab consensus; minority partitions cannot serve requests.</li>
      </ul>
      <p>
        <strong>AP Systems</strong> (Availability + Partition Tolerance): These systems
        remain available during partitions but may return stale or conflicting data.
      </p>
      <ul>
        <li><strong>Cassandra</strong> &mdash; Tunable consistency, but defaults to eventual consistency with high availability.</li>
        <li><strong>DynamoDB</strong> &mdash; Eventually consistent reads by default; always available across partitions.</li>
        <li><strong>CouchDB</strong> &mdash; Multi-master replication with conflict resolution; stays available during partitions.</li>
      </ul>

      <InfoBox title="PACELC Theorem">
        <p>
          The PACELC theorem extends CAP by addressing behavior when no partition exists.
          It states: if there is a <strong>P</strong>artition, choose between
          <strong>A</strong>vailability and <strong>C</strong>onsistency; <strong>E</strong>lse
          (when running normally), choose between <strong>L</strong>atency and
          <strong>C</strong>onsistency.
        </p>
        <p>
          For example, DynamoDB is PA/EL (available during partitions, low latency normally),
          while MongoDB is PC/EC (consistent during partitions, consistent normally at the
          cost of latency). This gives a more nuanced view of system trade-offs.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"A social media app needs to show users' feeds. Posts can be slightly delayed but the feed must always load. During a network partition between data centers, what should the system prioritize?"}
        options={[
          'Consistency — block the feed until all data centers agree on the latest posts',
          'Availability — show the feed with potentially stale posts rather than returning an error',
          'Partition Tolerance — this is always required so it is not a choice',
          'None of the above — CAP does not apply to social media'
        ]}
        correctIndex={1}
        explanation={"Social media feeds are a classic AP use case. Users expect the feed to always load even if some posts are slightly delayed. Showing a slightly stale feed is far better than showing an error page. Partition tolerance is always required, so the real choice during a partition is between consistency and availability."}
      />

      {/* ===== Section 2: Consistency Models ===== */}
      <h2>Consistency Models</h2>
      <p>
        Consistency models define the contract between a distributed data store and its
        clients regarding the ordering and visibility of updates. Choosing the right model
        is critical for balancing correctness, performance, and user experience.
      </p>

      <h3>Strong Consistency (Linearizability)</h3>
      <p>
        Every read returns the value of the most recent completed write. Operations appear
        to execute atomically and in real-time order. This is the easiest model to reason
        about but the most expensive to implement in a distributed system. It requires
        coordination (consensus) between nodes on every operation.
      </p>
      <p>
        <strong>Use when:</strong> Financial transactions, inventory management, leader
        election, or any scenario where stale reads could cause incorrect behavior.
      </p>

      <h3>Eventual Consistency</h3>
      <p>
        If no new updates are made, all replicas will eventually converge to the same value.
        There is no bound on how long convergence takes. Reads may return stale data, and
        different clients may see different values at the same time.
      </p>
      <p>
        <strong>Use when:</strong> Social media feeds, DNS, analytics, caching layers, or
        any scenario where temporary staleness is acceptable for better performance and
        availability.
      </p>

      <h3>Causal Consistency</h3>
      <p>
        Operations that are causally related are seen by all nodes in the same order.
        Concurrent operations (those with no causal relationship) may be seen in different
        orders by different nodes. This is stronger than eventual consistency but weaker
        than strong consistency.
      </p>
      <p>
        <strong>Use when:</strong> Collaborative editing, comment threads (a reply must
        appear after the original post), or any system where cause-and-effect ordering
        matters.
      </p>

      <h3>Read-Your-Writes Consistency</h3>
      <p>
        A client always sees its own writes. After a client writes a value, subsequent reads
        by that same client will always return that value or a more recent one. Other clients
        may still see stale data.
      </p>
      <p>
        <strong>Use when:</strong> User profile updates (a user should see their own changes
        immediately), shopping carts, or any user-facing write followed by a read.
      </p>

      <h3>Monotonic Reads</h3>
      <p>
        Once a client reads a value, it will never see an older value in subsequent reads.
        Time does not appear to go backward for any given client. This prevents the confusing
        experience of seeing newer data, then suddenly seeing older data.
      </p>
      <p>
        <strong>Use when:</strong> Dashboards, message streams, any interface where users
        would be confused by data appearing to revert.
      </p>

      {/* ===== Section 3: Consensus Algorithms ===== */}
      <h2>Consensus Algorithms</h2>
      <p>
        Consensus algorithms allow a collection of machines to work as a coherent group
        that can survive the failure of some members. They are the foundation of strongly
        consistent distributed systems and are used for leader election, configuration
        management, and distributed locking.
      </p>

      <h3>Why Consensus Is Needed</h3>
      <p>
        In a distributed system, nodes can fail, messages can be delayed or lost, and
        network partitions can occur. Without consensus, nodes may disagree on the state
        of the system &mdash; leading to split-brain scenarios, data corruption, or
        inconsistent behavior. Consensus ensures that all non-faulty nodes agree on the
        same sequence of operations.
      </p>

      <h3>Paxos</h3>
      <p>
        Paxos, designed by Leslie Lamport, is one of the earliest consensus algorithms.
        It operates in two main phases:
      </p>
      <ul>
        <li>
          <strong>Prepare Phase:</strong> A proposer selects a proposal number and sends
          a prepare request to a majority of acceptors. Each acceptor promises not to accept
          proposals with lower numbers and responds with any previously accepted value.
        </li>
        <li>
          <strong>Accept Phase:</strong> If the proposer receives promises from a majority,
          it sends an accept request with the proposal number and a value (either its own
          or one returned during prepare). Acceptors accept if they have not promised to a
          higher-numbered proposal.
        </li>
      </ul>
      <p>
        Paxos is provably correct but notoriously difficult to understand and implement.
        Multi-Paxos extends it for a sequence of decisions but adds significant complexity.
      </p>

      <h3>Raft</h3>
      <p>
        Raft was designed as an understandable alternative to Paxos. It decomposes consensus
        into three sub-problems: leader election, log replication, and safety.
      </p>
      <ul>
        <li>
          <strong>Leader Election:</strong> Nodes start as followers. If a follower receives
          no heartbeat within a randomized timeout, it becomes a candidate and requests
          votes. A candidate that receives a majority of votes becomes the leader.
        </li>
        <li>
          <strong>Log Replication:</strong> The leader accepts client requests, appends them
          to its log, and replicates entries to followers. Once a majority acknowledges an
          entry, it is committed and applied to the state machine.
        </li>
        <li>
          <strong>Safety:</strong> Raft guarantees that only a node with the most up-to-date
          log can win an election, preventing data loss.
        </li>
      </ul>

      <FlowChart
        title="Raft Leader Election Process"
        chart={"graph TD\nA[Node starts as Follower] --> B{Heartbeat timeout?}\nB -->|No| A\nB -->|Yes| C[Becomes Candidate]\nC --> D[Increments term, votes for self]\nD --> E[Sends RequestVote to all nodes]\nE --> F{Majority votes received?}\nF -->|Yes| G[Becomes Leader]\nF -->|No, higher term seen| A\nG --> H[Sends heartbeats to all followers]\nH --> I{Leader still healthy?}\nI -->|Yes| H\nI -->|No| A"}
      />

      <InfoBox title="Raft: Designed for Understandability">
        <p>
          Raft was explicitly designed to be easier to understand than Paxos. The authors
          conducted a user study showing that students learned Raft significantly faster.
          Key design decisions include a strong leader model (all writes go through the
          leader), randomized election timeouts to avoid split votes, and a clear separation
          of concerns. Today, Raft is used in production systems like etcd (Kubernetes),
          CockroachDB, Consul, and TiKV.
        </p>
      </InfoBox>

      {/* ===== Section 4: Distributed Transactions ===== */}
      <h2>Distributed Transactions</h2>
      <p>
        Distributed transactions span multiple services or databases. They are fundamentally
        harder than local transactions because network failures, partial failures, and
        message ordering issues can leave the system in an inconsistent state.
      </p>

      <h3>Two-Phase Commit (2PC)</h3>
      <p>
        2PC is a protocol that ensures all participants in a distributed transaction either
        commit or abort together. It uses a coordinator to manage the process.
      </p>

      <FlowChart
        title="Two-Phase Commit Protocol"
        chart={"graph TD\nA[Coordinator: Begin Transaction] --> B[Phase 1: Prepare]\nB --> C[Send PREPARE to all participants]\nC --> D{All participants vote YES?}\nD -->|Yes| E[Phase 2: Commit]\nE --> F[Send COMMIT to all participants]\nF --> G[Participants commit and acknowledge]\nG --> H[Transaction Complete]\nD -->|Any votes NO| I[Phase 2: Abort]\nI --> J[Send ABORT to all participants]\nJ --> K[Participants rollback]\nK --> L[Transaction Aborted]"}
      />

      <p>
        <strong>Problems with 2PC:</strong>
      </p>
      <ul>
        <li>
          <strong>Blocking:</strong> If the coordinator crashes after sending PREPARE but
          before sending COMMIT/ABORT, participants are stuck holding locks indefinitely,
          unable to proceed.
        </li>
        <li>
          <strong>Single point of failure:</strong> The coordinator is a critical dependency.
          Its failure can block the entire system.
        </li>
        <li>
          <strong>Performance:</strong> Two rounds of network communication plus lock
          holding make 2PC slow, especially across data centers.
        </li>
        <li>
          <strong>Not partition tolerant:</strong> If a network partition separates the
          coordinator from some participants, those participants are blocked.
        </li>
      </ul>

      <h3>Saga Pattern</h3>
      <p>
        The Saga pattern breaks a distributed transaction into a sequence of local
        transactions, each with a compensating transaction that undoes its work if a later
        step fails. There are two coordination approaches:
      </p>
      <ul>
        <li>
          <strong>Choreography:</strong> Each service publishes events that trigger the next
          step. There is no central coordinator. This is simpler for small workflows but
          becomes hard to track as the number of steps grows.
        </li>
        <li>
          <strong>Orchestration:</strong> A central orchestrator tells each service what to
          do and when. It manages the workflow and triggers compensations on failure. This
          is easier to understand and debug for complex workflows.
        </li>
      </ul>

      <FlowChart
        title="Saga with Compensating Transactions"
        chart={"graph TD\nA[Order Service: Create Order] --> B[Payment Service: Charge Payment]\nB --> C[Inventory Service: Reserve Stock]\nC --> D{Shipping Service: Arrange Delivery}\nD -->|Success| E[Saga Complete]\nD -->|Failure| F[Compensate: Release Stock]\nF --> G[Compensate: Refund Payment]\nG --> H[Compensate: Cancel Order]\nH --> I[Saga Rolled Back]"}
      />

      <CodeBlock
        title="Saga Orchestrator Pseudocode"
        language="javascript"
        code={`class OrderSaga {
  constructor(orderId, orderData) {
    this.orderId = orderId;
    this.orderData = orderData;
    this.completedSteps = [];
  }

  async execute() {
    try {
      // Step 1: Create the order
      await this.createOrder();
      this.completedSteps.push('CREATE_ORDER');

      // Step 2: Process payment
      await this.processPayment();
      this.completedSteps.push('PROCESS_PAYMENT');

      // Step 3: Reserve inventory
      await this.reserveInventory();
      this.completedSteps.push('RESERVE_INVENTORY');

      // Step 4: Arrange shipping
      await this.arrangeShipping();
      this.completedSteps.push('ARRANGE_SHIPPING');

      return { status: 'COMPLETED', orderId: this.orderId };
    } catch (error) {
      // Compensate in reverse order
      await this.compensate();
      return { status: 'ROLLED_BACK', orderId: this.orderId, error };
    }
  }

  async compensate() {
    const compensations = {
      ARRANGE_SHIPPING: () => this.cancelShipping(),
      RESERVE_INVENTORY: () => this.releaseInventory(),
      PROCESS_PAYMENT: () => this.refundPayment(),
      CREATE_ORDER: () => this.cancelOrder(),
    };

    // Compensate in reverse order of completion
    for (const step of [...this.completedSteps].reverse()) {
      try {
        await compensations[step]();
      } catch (compError) {
        // Log and continue — compensation must be best-effort
        console.error(\`Compensation failed for \${step}:\`, compError);
      }
    }
  }
}`}
      />

      <InfoBox title="Prefer Eventual Consistency Over 2PC">
        <p>
          In microservice architectures, 2PC is generally avoided because it introduces
          tight coupling, blocks resources, and does not handle network partitions well.
          Instead, prefer the Saga pattern with eventual consistency. Design your services
          to tolerate temporary inconsistency and use compensating transactions to correct
          failures. This approach is more resilient, scalable, and better suited to the
          realities of distributed systems.
        </p>
      </InfoBox>

      {/* ===== Section 5: Idempotency ===== */}
      <h2>Idempotency</h2>
      <p>
        An operation is idempotent if performing it multiple times has the same effect as
        performing it once. In distributed systems, network failures and retries are
        inevitable, so idempotency is essential to prevent duplicate side effects.
      </p>

      <h3>Why Idempotency Matters</h3>
      <p>
        Consider a payment API: a client sends a charge request, the server processes it,
        but the response is lost due to a network failure. The client retries, and without
        idempotency, the customer is charged twice. Idempotent APIs ensure that retrying
        a request produces the same result without double-processing.
      </p>

      <h3>Idempotency Keys</h3>
      <p>
        The most common approach is to have clients include a unique idempotency key with
        each request. The server stores the result of the first execution and returns the
        cached result for any subsequent requests with the same key.
      </p>

      <CodeBlock
        title="Idempotent API Design"
        language="javascript"
        code={`async function processPayment(req, res) {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header required' });
  }

  // Check if this request was already processed
  const existing = await db.idempotencyKeys.findOne({ key: idempotencyKey });
  if (existing) {
    // Return the cached response — do not reprocess
    return res.status(existing.statusCode).json(existing.responseBody);
  }

  // Lock the key to prevent concurrent duplicate processing
  const lock = await db.idempotencyKeys.insertOne({
    key: idempotencyKey,
    status: 'processing',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
  });

  try {
    const result = await chargePaymentProvider(req.body);

    // Store the successful result
    await db.idempotencyKeys.updateOne(
      { key: idempotencyKey },
      { $set: { status: 'complete', statusCode: 200, responseBody: result } }
    );

    return res.status(200).json(result);
  } catch (error) {
    // Remove the key so the client can retry
    await db.idempotencyKeys.deleteOne({ key: idempotencyKey });
    return res.status(500).json({ error: 'Payment processing failed' });
  }
}`}
      />

      <h3>HTTP Method Idempotency</h3>
      <ul>
        <li><strong>GET, HEAD, OPTIONS:</strong> Always idempotent (read-only, no side effects).</li>
        <li><strong>PUT:</strong> Idempotent by definition &mdash; replacing a resource with the same data multiple times yields the same result.</li>
        <li><strong>DELETE:</strong> Idempotent &mdash; deleting a resource that is already deleted should return success (or 404), not an error.</li>
        <li><strong>POST:</strong> Not inherently idempotent &mdash; each call may create a new resource. Use idempotency keys to make POST requests safe to retry.</li>
        <li><strong>PATCH:</strong> Not inherently idempotent &mdash; depends on the operation. Incrementing a counter via PATCH is not idempotent; setting a field to a specific value is.</li>
      </ul>

      {/* ===== Section 6: Distributed Locking ===== */}
      <h2>Distributed Locking</h2>
      <p>
        Distributed locks ensure that only one process across multiple nodes can access a
        shared resource at a time. They are used for preventing duplicate processing,
        coordinating scheduled jobs, and protecting critical sections in distributed systems.
      </p>

      <h3>Why Distributed Locks Are Needed</h3>
      <p>
        In a single-process application, you can use mutexes or synchronized blocks. In a
        distributed system with multiple instances of a service, local locks are useless
        because each instance has its own memory space. You need a shared, external lock
        manager that all instances can coordinate through.
      </p>

      <h3>Redlock Algorithm</h3>
      <p>
        Redlock, proposed by Salvatore Sanfilippo (creator of Redis), uses multiple
        independent Redis instances to provide a more reliable distributed lock:
      </p>
      <ol>
        <li>Get the current time in milliseconds.</li>
        <li>Try to acquire the lock on N Redis instances (typically 5) using the same key and a random value, with a small timeout on each attempt.</li>
        <li>Calculate the elapsed time. The lock is acquired only if it was obtained on a majority (N/2 + 1) of instances and the total elapsed time is less than the lock&apos;s TTL.</li>
        <li>If acquired, the effective lock validity time is the original TTL minus the elapsed time.</li>
        <li>If the lock was not acquired on a majority, unlock all instances immediately.</li>
      </ol>

      <h3>Fencing Tokens</h3>
      <p>
        Even with distributed locks, a process that holds a lock can be paused (e.g., by
        garbage collection) long enough for the lock to expire. Another process acquires
        the lock, and now both believe they hold it. Fencing tokens solve this by assigning
        a monotonically increasing token each time a lock is acquired. The resource being
        protected rejects any request with a token lower than the highest it has seen.
      </p>

      <InfoBox title="Distributed Lock Pitfalls">
        <p>
          Distributed locks are surprisingly difficult to get right. Common pitfalls include:
          relying on a single Redis instance (which creates a single point of failure),
          not setting appropriate TTLs (too short causes premature expiration, too long
          causes deadlocks), ignoring clock skew between nodes, and assuming the lock
          protects against all races (it does not protect against GC pauses or network
          delays after acquisition). Martin Kleppmann has argued that Redlock is fundamentally
          flawed &mdash; consider whether you truly need distributed locking or if you can
          design around it.
        </p>
      </InfoBox>

      {/* ===== Section 7: Consistent Hashing ===== */}
      <h2>Consistent Hashing</h2>
      <p>
        Traditional hash-based partitioning (key mod N) breaks when you add or remove nodes
        because it changes the mapping for nearly every key. Consistent hashing solves this
        by minimizing the number of keys that need to be remapped.
      </p>

      <h3>How It Works</h3>
      <p>
        Imagine a circular hash space (a ring) from 0 to 2^32. Both nodes and keys are
        hashed onto this ring. Each key is assigned to the first node encountered when
        walking clockwise from the key&apos;s position. When a node is added or removed,
        only the keys between the affected node and its predecessor need to be remapped.
      </p>

      <h3>Virtual Nodes</h3>
      <p>
        With a small number of physical nodes, the distribution can be uneven &mdash; some
        nodes may be responsible for a disproportionately large portion of the ring. Virtual
        nodes solve this by mapping each physical node to multiple positions on the ring.
        A node with 150 virtual nodes will have 150 positions spread around the ring,
        resulting in a much more uniform distribution.
      </p>

      <FlowChart
        title="Consistent Hashing Ring with Virtual Nodes"
        chart={"graph TD\nA[Hash Ring: 0 to 2^32] --> B[Node A mapped to positions 10, 90, 200]\nA --> C[Node B mapped to positions 50, 150, 280]\nA --> D[Node C mapped to positions 30, 120, 240]\nB --> E[Key X hashes to 45 → assigned to Node B at position 50]\nC --> F[Key Y hashes to 100 → assigned to Node C at position 120]\nD --> G[Node C removed: only keys between C positions reassigned]\nG --> H[Most keys remain on same node → minimal disruption]"}
      />

      <p>
        Consistent hashing is used in systems like Amazon DynamoDB, Apache Cassandra,
        Memcached, and content delivery networks. It provides O(K/N) key remapping on
        topology changes instead of O(K) with traditional hashing, where K is the number
        of keys and N is the number of nodes.
      </p>

      {/* ===== Section 8: Other Distributed Concepts ===== */}
      <h2>Other Distributed Concepts</h2>

      <h3>Vector Clocks</h3>
      <p>
        Vector clocks are a mechanism for tracking causality in distributed systems. Each
        node maintains a vector of logical timestamps, one per node. When a node performs
        an operation, it increments its own entry. When it sends a message, it includes its
        vector. The receiver merges the vectors by taking the element-wise maximum.
      </p>
      <p>
        Vector clocks allow you to determine if two events are causally related or
        concurrent. If event A&apos;s vector is less than or equal to event B&apos;s vector
        in every component, then A happened before B. If neither is strictly less than the
        other, the events are concurrent and may conflict &mdash; requiring application-level
        resolution.
      </p>

      <h3>Gossip Protocol</h3>
      <p>
        The gossip protocol (also called epidemic protocol) is a peer-to-peer communication
        mechanism where nodes periodically exchange state information with random peers.
        Like the spread of a rumor, information eventually reaches all nodes.
      </p>
      <ul>
        <li>Each node periodically selects a random peer and exchanges state.</li>
        <li>Information propagates exponentially &mdash; reaching all N nodes in O(log N) rounds.</li>
        <li>Highly fault-tolerant: works even when many nodes are unreachable.</li>
        <li>Used by Cassandra, Consul, and SWIM for membership and failure detection.</li>
      </ul>

      <h3>Split-Brain Problem</h3>
      <p>
        Split-brain occurs when a network partition divides a cluster into two or more
        sub-groups, each believing it is the entire cluster. Both partitions may elect
        their own leader and accept writes independently, leading to data divergence.
      </p>
      <p>Solutions include:</p>
      <ul>
        <li><strong>Quorum-based decisions:</strong> Only the partition with a majority of nodes can operate. Minority partitions become read-only or unavailable.</li>
        <li><strong>Fencing:</strong> Use a shared resource (like a disk) as a tie-breaker. The partition that can access it continues; the other shuts down.</li>
        <li><strong>Odd-numbered clusters:</strong> Using 3, 5, or 7 nodes makes it impossible for two partitions to both have a majority.</li>
      </ul>

      <h3>Service Discovery</h3>
      <p>
        In dynamic distributed systems, services need to find each other. Service discovery
        provides a registry of available service instances and their network locations.
      </p>
      <ul>
        <li>
          <strong>Client-Side Discovery:</strong> The client queries a service registry
          (e.g., Consul, etcd, ZooKeeper) and selects an instance using a load balancing
          strategy. The client is responsible for choosing and connecting to the instance.
        </li>
        <li>
          <strong>Server-Side Discovery:</strong> The client sends requests to a load
          balancer or API gateway, which queries the registry and routes the request.
          The client does not need to know about the registry at all.
        </li>
      </ul>

      <FlowChart
        title="Service Discovery Patterns"
        chart={"graph TD\nA[Client-Side Discovery] --> B[Client queries Service Registry]\nB --> C[Registry returns list of instances]\nC --> D[Client selects instance via load balancing]\nD --> E[Client connects directly to chosen instance]\nF[Server-Side Discovery] --> G[Client sends request to Load Balancer]\nG --> H[Load Balancer queries Service Registry]\nH --> I[Registry returns available instances]\nI --> J[Load Balancer routes request to an instance]"}
      />

      {/* ===== Section 9: Resilience Patterns ===== */}
      <h2>Resilience Patterns</h2>
      <p>
        Distributed systems must be designed to handle failures gracefully. Resilience
        patterns help prevent cascading failures, reduce the blast radius of outages, and
        allow systems to recover automatically.
      </p>

      <h3>Circuit Breaker Pattern</h3>
      <p>
        The circuit breaker monitors calls to an external service and trips (opens) when
        failures exceed a threshold. While open, requests fail immediately without calling
        the service, preventing resource exhaustion. After a timeout, the circuit enters a
        half-open state and allows a limited number of test requests through.
      </p>
      <ul>
        <li><strong>Closed:</strong> Normal operation. Requests pass through. Failures are counted. If failures exceed the threshold, transition to Open.</li>
        <li><strong>Open:</strong> All requests fail immediately with a fallback response. After the reset timeout, transition to Half-Open.</li>
        <li><strong>Half-Open:</strong> A limited number of test requests are allowed through. If they succeed, transition back to Closed. If they fail, transition back to Open.</li>
      </ul>

      <FlowChart
        title="Circuit Breaker State Machine"
        chart={"graph TD\nA[CLOSED - Normal Operation] -->|Failure threshold exceeded| B[OPEN - Requests Fail Fast]\nB -->|Reset timeout expires| C[HALF-OPEN - Test Requests]\nC -->|Test requests succeed| A\nC -->|Test requests fail| B\nA -->|Requests succeeding| A\nB -->|Within timeout| B"}
      />

      <h3>Bulkhead Pattern</h3>
      <p>
        The bulkhead pattern isolates different parts of a system so that a failure in one
        does not cascade to others. Named after the watertight compartments in a ship, it
        applies to software by partitioning resources:
      </p>
      <ul>
        <li>Separate thread pools for different downstream services.</li>
        <li>Separate connection pools per dependency.</li>
        <li>Dedicated resource limits per tenant in multi-tenant systems.</li>
      </ul>
      <p>
        If one downstream service becomes slow and exhausts its thread pool, other services
        remain unaffected because they use their own isolated pools.
      </p>

      <h3>Retry with Exponential Backoff &amp; Jitter</h3>
      <p>
        When a request fails, retrying immediately can overwhelm a struggling service.
        Exponential backoff increases the delay between retries exponentially (1s, 2s, 4s,
        8s, ...), giving the service time to recover. Adding random jitter prevents the
        thundering herd problem where many clients retry at the exact same time.
      </p>

      <CodeBlock
        title="Exponential Backoff with Jitter"
        language="javascript"
        code={`async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 5,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    jitterFactor = 0.5,
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Do not retry non-transient errors
      if (error.statusCode >= 400 && error.statusCode < 500) throw error;

      // Calculate delay with exponential backoff
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

      // Add random jitter to prevent thundering herd
      const jitter = cappedDelay * jitterFactor * Math.random();
      const delay = cappedDelay + jitter;

      console.log(
        \`Attempt \${attempt + 1} failed. Retrying in \${Math.round(delay)}ms...\`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Usage
const result = await retryWithBackoff(
  () => fetch('https://api.example.com/data'),
  { maxRetries: 3, baseDelayMs: 500 }
);`}
      />

      <InfoBox title="Combine Resilience Patterns">
        <p>
          In production systems, resilience patterns are most effective when combined.
          A typical setup uses retries with exponential backoff for transient failures,
          wrapped in a circuit breaker to stop retrying when a service is clearly down,
          with bulkheads to isolate the blast radius. Add timeouts to every external call
          and use fallbacks (cached data, default values, degraded functionality) when all
          else fails.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"A microservice is experiencing intermittent timeouts when calling a payment provider. The payment provider occasionally goes down for 30-60 seconds. What combination of patterns would best handle this?"}
        options={[
          'Only retry failed requests immediately with no delay',
          'Circuit breaker to stop calling when down, retries with exponential backoff when circuit is closed, and a fallback to queue payments for later processing',
          'Increase the timeout to 5 minutes so requests always succeed',
          'Use distributed locking to ensure only one request at a time reaches the payment provider'
        ]}
        correctIndex={1}
        explanation={"The circuit breaker detects when the payment provider is down and stops sending requests, preventing resource exhaustion. Retries with exponential backoff handle transient failures gracefully. A fallback mechanism such as queuing payments ensures the system degrades gracefully rather than failing entirely. Immediate retries would overwhelm the provider, long timeouts waste resources, and distributed locking is unrelated to resilience."}
      />
    </LessonLayout>
  );
}
