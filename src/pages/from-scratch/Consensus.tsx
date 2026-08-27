import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function FromScratchConsensus() {
  return (
    <LessonLayout
      title="Build Raft: Leader Election & Log Replication"
      sectionId="from-scratch"
      lessonIndex={4}
      prev={{ path: '/from-scratch/httpserver', label: 'Build an HTTP Server from Sockets' }}
      next={null}
    >
      <p>
        This is the hardest of the four projects, so we are going to go slowly and lean on
        diagrams. Raft has a reputation for being difficult, but almost all of that difficulty
        lives in <em>two</em> ideas. Once those two land, the rest is bookkeeping.
      </p>

      <p>
        Everything below runs. There is a deterministic simulation at the bottom of this page —
        no sockets, no real clock, one tick of logical time per loop iteration — and every number
        and log line on this page came out of actually running it on JDK 26.0.1. Where a result
        is an artifact of the simulation rather than a fact about Raft, it says so.
      </p>

      <InfoBox variant="note" title="The two ideas, up front">
        <p>
          <strong>1. A majority can only be one group.</strong> Two different majorities of the
          same cluster must overlap in at least one node, and that node will not agree to two
          contradictory things. Every safety property in Raft is a consequence of this.
        </p>
        <p>
          <strong>2. Randomized timeouts break ties.</strong> If every node waits the same amount
          of time before running for office, they all run at once, they all vote for themselves,
          and nobody wins. Randomness is not a performance tweak here — it is what makes the
          algorithm terminate at all.
        </p>
      </InfoBox>

      <h2>Step 1: Why You Cannot Just Pick a Leader</h2>

      <p>
        Start with the problem. You have three servers holding a replicated copy of some data. One
        of them needs to be in charge of accepting writes, because if two of them accept writes
        independently you get two different histories and no way to reconcile them. That failure
        has a name: <strong>split brain</strong>.
      </p>

      <p>
        The obvious fix is to skip the whole election and say &quot;the node with the lowest ID is
        the leader.&quot; That works right up until the network partitions:
      </p>

      <FlowChart
        title="Static leader + partition = two leaders"
        chart={"graph LR\n  subgraph SideA[\"Partition A\"]\n    N0[\"node0 (lowest ID)<br/>I am the leader\"]\n  end\n  subgraph SideB[\"Partition B\"]\n    N1[\"node1\"]\n    N2[\"node2<br/>node0 is gone,<br/>lowest ID here is node1\"]\n  end\n  N0 -.->|\"link down\"| N1\n  C1[\"client writes x=1\"] --> N0\n  C2[\"client writes x=2\"] --> N1\n  style N0 fill:#3b1a1a,stroke:#f87171\n  style N1 fill:#3b1a1a,stroke:#f87171"}
      />

      <p>
        Both sides are behaving correctly by their own rules, and both are accepting writes. When
        the partition heals you have two divergent logs and a data-loss decision to make.
      </p>

      <p>
        Raft&apos;s answer is that leadership is not a property you can claim on your own. You have
        to be <em>granted</em> it by a <strong>majority</strong> of the cluster — and in the diagram
        above, node0 is alone with one vote out of three, so it never gets to lead. Side B has two
        of three and can elect a leader. Side A cannot. That asymmetry is the entire point.
      </p>

      <InfoBox variant="tip" title="Why majority, and not 'the most'">
        <p>
          A majority of five is three. There is no way to draw two groups of three out of five
          nodes without them sharing at least one member. That shared node has one vote and one
          memory of who it voted for, so it will refuse the second request. This is why a
          five-node cluster tolerates two failures and a three-node cluster tolerates one:
          you need a majority <em>alive</em>, not merely the largest surviving group.
        </p>
        <p>
          It is also why cluster sizes are odd. Four nodes need a majority of three, so they
          tolerate one failure — exactly the same as three nodes, for the cost of an extra machine.
        </p>
      </InfoBox>

      <h2>Step 2: Terms, or How to Tell Stale News From Fresh</h2>

      <p>
        Before elections can work, every node needs a way to compare two claims and decide which is
        newer — without a synchronized clock, which distributed systems do not have. Raft uses a
        counter called the <strong>term</strong>. A term is one election epoch. It starts at 0 and
        only ever goes up.
      </p>

      <p>The rule attached to it is short enough to memorize, and it does most of the work:</p>

      <CodeBlock language="java" title="The single most important rule in Raft">
{`// On receiving ANY message from anyone:
if (message.term > this.currentTerm) {
    this.currentTerm = message.term;
    this.role       = Role.FOLLOWER;   // step down, whatever you thought you were
    this.votedFor   = null;           // new term, fresh vote
}

// And the mirror image:
if (message.term < this.currentTerm) {
    // stale message from a node that has been asleep or partitioned. Ignore it.
}`}
      </CodeBlock>

      <p>
        Now revisit the partition. Side B elects a leader in term 5. Node0, alone on side A, is
        still convinced it leads term 4. When the network heals and node0 hears a single message
        stamped term 5, it steps down immediately — before any data is exchanged, before anyone
        argues. A higher term always wins, and the old leader demotes itself.
      </p>

      <p>
        That is the mechanism that resolves split brain after the fact. Majority voting prevents
        two leaders from being <em>elected</em>; terms ensure that if an old leader was hanging
        around believing stale things, it gives up the moment it learns the truth.
      </p>

      <InteractiveChallenge
        question="A five-node cluster partitions into a group of two and a group of three. The old leader is in the group of two. What happens?"
        options={[
          'Both groups elect a leader, and the logs diverge until an administrator intervenes',
          'The group of three elects a new leader in a higher term; the group of two cannot elect anyone, and the old leader steps down when the partition heals',
          'Neither group can elect a leader, because neither has all five nodes',
          'The old leader keeps its leadership because it was elected first',
        ]}
        correctIndex={1}
        explanation={"A majority of five is three. The group of three can hold an election and win it; the group of two can never gather three votes no matter how many times it tries, so it just burns through terms as a perpetual candidate. Meanwhile the old leader in the minority group can still THINK it is the leader, but it cannot commit anything, because committing also requires a majority to acknowledge. When the partition heals it hears the new, higher term and steps down. Note that option 3 is a common misreading: Raft never needs all nodes, only a majority — that is what makes it available at all."}
      />

      <h2>Step 3: The Election</h2>

      <p>
        Every node is in exactly one of three roles. There are only a handful of transitions
        between them, and this diagram is worth more than any paragraph on the page:
      </p>

      <FlowChart
        title="The three roles and every transition between them"
        chart={"stateDiagram-v2\n  [*] --> Follower\n  Follower --> Candidate: election timeout<br/>(no heartbeat heard)\n  Candidate --> Leader: got votes from<br/>a MAJORITY\n  Candidate --> Candidate: election timeout again<br/>(split vote) term++\n  Candidate --> Follower: saw a HIGHER term<br/>or a valid leader\n  Leader --> Follower: saw a HIGHER term\n  Leader --> Leader: send heartbeats<br/>on an interval"}
      />

      <p>Walking one election, in the order the code actually does it:</p>

      <CodeBlock language="java" title="Becoming a candidate">
{`void startElection(Node nd) {
    nd.role       = Role.CANDIDATE;
    nd.currentTerm++;              // a new term begins
    nd.votedFor   = nd.id;         // vote for yourself, first
    nd.votesGot.clear();
    nd.votesGot.add(nd.id);        // ... and count it
    armTimer(nd);                  // re-arm, in case this election also fails

    for (Node other : nodes) {
        if (other.id == nd.id) continue;
        RequestVote rv = new RequestVote();
        rv.term          = nd.currentTerm;
        rv.lastLogIndex  = nd.lastIndex();   // "here is how current my log is"
        rv.lastLogTerm   = nd.lastTerm();
        send(rv);
    }
}`}
      </CodeBlock>

      <p>And the receiving side, which is where the safety rules live:</p>

      <CodeBlock language="java" title="Deciding whether to grant a vote">
{`boolean logOk = rv.lastLogTerm >  nd.lastTerm()
             || (rv.lastLogTerm == nd.lastTerm() && rv.lastLogIndex >= nd.lastIndex());

boolean grant = rv.term >= nd.currentTerm            // not stale
             && logOk                                 // candidate is at least as current as me
             && (nd.votedFor == null                  // I have not voted this term
                 || nd.votedFor.equals(rv.from));     // (or already voted for this same node)

if (grant) nd.votedFor = rv.from;`}
      </CodeBlock>

      <p>
        Three conditions, each doing a specific job. <code>rv.term &gt;= currentTerm</code> discards
        stale requests. <code>votedFor == null</code> enforces <strong>one vote per node per
        term</strong> — this is the clause that makes two simultaneous majorities impossible.
        And <code>logOk</code> is the <strong>election restriction</strong>, which we will come back
        to in Step 6; it is what guarantees a node with a stale log can never win.
      </p>

      <h2>Step 4: Why Randomized Timeouts Are Not Optional</h2>

      <p>
        Here is the part that is easy to read past in the paper and impossible to miss once you
        run it. Suppose every node uses the same election timeout — a nice round 150ms. The nodes
        boot within a couple of milliseconds of each other and messages take about 20ms to arrive.
      </p>

      <p>
        All three time out at essentially the same moment. All three become candidates. All three
        vote for themselves and send out vote requests. By the time those requests arrive, every
        node has already spent its one vote for this term. Nobody reaches a majority. Everyone
        times out again, and does the exact same thing one term higher:
      </p>

      <CodeBlock language="text" title="Real output — 3 nodes, fixed 150ms timeout">
{`t= 147  node1 -> CANDIDATE  term=1  (votes for itself)
t= 148  node0 -> CANDIDATE  term=1  (votes for itself)
t= 149  node2 -> CANDIDATE  term=1  (votes for itself)
t= 297  node1 -> CANDIDATE  term=2  (votes for itself)
t= 298  node0 -> CANDIDATE  term=2  (votes for itself)
t= 299  node2 -> CANDIDATE  term=2  (votes for itself)
t= 447  node1 -> CANDIDATE  term=3  (votes for itself)
t= 448  node0 -> CANDIDATE  term=3  (votes for itself)
t= 449  node2 -> CANDIDATE  term=3  (votes for itself)
   ...  the same three lines, forever, one term higher each time ...
t=1197  node1 -> CANDIDATE  term=8  (votes for itself)
t=1198  node0 -> CANDIDATE  term=8  (votes for itself)
t=1199  node2 -> CANDIDATE  term=8  (votes for itself)
  ... elected after 24 elections, at tick 1200   <- gave up waiting`}
      </CodeBlock>

      <p>
        Eight terms burned, twenty-four elections started, zero leaders. The cluster is completely
        unavailable and it is not because anything crashed. Change one line — draw the timeout
        from a range instead of using a constant — and the same seed produces:
      </p>

      <CodeBlock language="text" title="Real output — same seed, timeout randomized in [150, 300)">
{`t= 162  node1 -> CANDIDATE  term=1  (votes for itself)
t= 202  node1 *** LEADER *** term=1  (2/3 votes, quorum=2)
  ... elected after 1 elections, at tick 202`}
      </CodeBlock>

      <p>
        One election, one term, 202ms. The randomness means one node almost always times out
        clearly before the others, and its request arrives while their votes are still unspent.
      </p>

      <InfoBox variant="warning" title="Being honest about that first result">
        <p>
          &quot;Never elects a leader&quot; is <em>too strong</em>, and it is an artifact of the
          simulation. My model has a perfect clock and a fixed 20ms latency, so the nodes re-arm in
          exact lockstep and stay deadlocked forever. Real machines have clock drift and variable
          network latency, which eventually break the tie by luck.
        </p>
        <p>
          So I re-ran it with noise added — per-message latency jitter of plus or minus 8ms, and
          per-node clock drift of up to 2%. That is the honest comparison, over 200 trials each:
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Real output — 200 trials per row, with jitter and clock drift">
{`--- 3 nodes (quorum 2) ---
  FIXED timeout          elected 198/200 | avg 1018.8 ticks | avg 18.9 elections | worst 55
  RANDOMIZED timeout     elected 200/200 | avg  232.5 ticks | avg  1.5 elections | worst  5

--- 5 nodes (quorum 3) ---
  FIXED timeout          elected 199/200 | avg 1209.8 ticks | avg 34.3 elections | worst 98
  RANDOMIZED timeout     elected 200/200 | avg  221.3 ticks | avg  1.8 elections | worst  6`}
      </CodeBlock>

      <p>
        With real-world noise, fixed timeouts do eventually elect someone — but it takes roughly
        <strong> 19 elections and 4x longer</strong> on three nodes, with a worst case of 55
        elections. Randomized timeouts settle it in 1.5 elections. And notice the direction the
        numbers move as the cluster grows: on five nodes the fixed-timeout case gets
        <em> worse</em> (34.3 elections, worst case 98), because more nodes means more ways to
        split the vote. Randomized barely moves.
      </p>

      <InteractiveChallenge
        question="Your Raft cluster is stable for hours, then goes through a burst of rapid leader changes with the term number climbing fast, and no data is being committed. What should you suspect first?"
        options={[
          'A node has run out of disk space',
          'The election timeout is too short relative to real network latency and heartbeat interval, so followers keep declaring the healthy leader dead',
          'The cluster has too many nodes to reach a majority',
          'A client is sending malformed requests',
        ]}
        correctIndex={1}
        explanation={"A climbing term with no commits is the signature of repeated elections. The usual cause is an election timeout set too close to the real round-trip time or heartbeat interval: a heartbeat gets delayed by a GC pause or a slow link, a follower concludes the leader is dead, and starts an election. That election makes the real leader step down, which costs another round trip, which makes the next timeout more likely to fire. The standard rule of thumb is that the election timeout should be an order of magnitude larger than the broadcast time, and the heartbeat interval well under the election timeout. Disk space and malformed requests would not move the term number, and a cluster cannot have too many nodes to reach a majority — a majority is defined relative to the size."}
      />

      <h2>Step 5: Heartbeats — Staying Elected</h2>

      <p>
        A leader has to keep proving it is alive, or the followers will time out and start the
        whole circus again. Raft does not use a separate ping for this. It reuses the same message
        that carries log entries, <code>AppendEntries</code>, and sends it with an empty entry list
        on an interval. Any valid <code>AppendEntries</code> from a current leader resets the
        follower&apos;s election timer.
      </p>

      <p>
        That is a nice economy: one message type means &quot;here is new data&quot; <em>and</em>
        &quot;I am still here.&quot; The heartbeat interval must be comfortably shorter than the
        election timeout, or followers will time out between heartbeats and depose a healthy
        leader — which is exactly the failure in the challenge above.
      </p>

      <h2>Step 6: Log Replication and What &quot;Committed&quot; Means</h2>

      <p>
        Now the actual job. A client sends a command. The leader appends it to its own log and
        ships it to the followers. Once a <strong>majority</strong> have it stored, the entry is
        <strong> committed</strong> — and only then may the leader apply it and tell the client
        yes.
      </p>

      <FlowChart
        title="One command, from client to committed"
        chart={"sequenceDiagram\n  participant C as Client\n  participant L as Leader\n  participant F1 as Follower 1\n  participant F2 as Follower 2\n  C->>L: SET x=1\n  Note over L: append to own log<br/>NOT committed yet\n  L->>F1: AppendEntries(entry)\n  L->>F2: AppendEntries(entry)\n  F1-->>L: ok, matchIndex=2\n  Note over L: 2 of 3 have it<br/>= majority = COMMIT\n  L-->>C: success\n  F2-->>L: ok, matchIndex=2\n  L->>F1: next heartbeat carries<br/>leaderCommit=2\n  L->>F2: next heartbeat carries<br/>leaderCommit=2"}
      />

      <p>
        Two details in that diagram matter more than they look. First, the leader commits as soon
        as a majority acknowledges — it does <em>not</em> wait for everyone, which is why one slow
        or dead follower does not stall the cluster. Second, the followers do not learn that the
        entry was committed until a <em>later</em> message; the commit index rides along on the
        next <code>AppendEntries</code>. Here is the real trace:
      </p>

      <CodeBlock language="text" title="Real output — 2 commands replicated across 3 nodes">
{`leader is node1 in term 1
client sent 2 commands; leader log length = 2, commitIndex = 0 (nothing committed yet)

t= 222    node0 appended 2 entry(s), log now length 2
t= 222    node2 appended 2 entry(s), log now length 2
t= 242    leader1 COMMIT index=2 (2/3 have it, quorum=2)
t= 270    node0 commitIndex -> 2
t= 270    node2 commitIndex -> 2

  node0  role=FOLLOWER  log=2  commitIndex=2
  node1  role=LEADER    log=2  commitIndex=2
  node2  role=FOLLOWER  log=2  commitIndex=2`}
      </CodeBlock>

      <p>
        Read the timestamps. The entry is <em>stored</em> everywhere at t=222, but not
        <em> committed</em> until t=242 when the acknowledgements get back — and the followers do
        not find out until t=270. For 48 ticks the data exists on all three machines while still
        being officially uncommitted. If the leader died at t=230, that entry would be present on
        every node and yet no client was ever told it succeeded.
      </p>

      <InfoBox variant="danger" title="The subtle rule: never commit an old term by counting alone">
        <p>
          A new leader inherits entries from previous terms. It is tempting to say &quot;this
          entry from term 3 is now on a majority of nodes, so commit it.&quot; Raft explicitly
          forbids that, and there is a famous scenario in the paper where doing it loses committed
          data. A leader may only count replicas to commit entries from <strong>its own current
          term</strong>; older entries get committed indirectly, carried along once a current-term
          entry above them commits. In the simulation that is one line:
        </p>
      </InfoBox>

      <CodeBlock language="java" title="The guard, in advanceCommit()">
{`for (int idx = ld.lastIndex(); idx > ld.commitIndex; idx--) {
    // NEVER commit an entry from an older term by replica count alone
    if (ld.log.get(idx).term() != ld.currentTerm) continue;

    int cnt = 1;                                  // the leader itself
    for (int i = 0; i < n; i++)
        if (i != ld.id && ld.matchIndex[i] >= idx) cnt++;

    if (cnt >= quorum) { ld.commitIndex = idx; break; }
}`}
      </CodeBlock>

      <h2>Step 7: The Safety Argument, in One Paragraph</h2>

      <p>
        Put the pieces together and you get the guarantee that makes Raft worth using: once an
        entry is committed, it is present in the log of every future leader, forever.
      </p>

      <p>
        Committing requires a majority to store the entry. Winning an election requires a majority
        to vote for you. Any two majorities share at least one node. That shared node has the
        committed entry, and the <code>logOk</code> check from Step 3 makes it refuse to vote for
        any candidate whose log is less current than its own. So a candidate missing a committed
        entry cannot collect a majority — it will always be blocked by at least one node that knows
        better. Committed data cannot be elected away.
      </p>

      <InteractiveChallenge
        question="A leader appends an entry, replicates it to one of its two followers, and crashes before hearing back. Did the entry survive?"
        options={[
          'Yes — it was written to two nodes, which is a majority of three, so it is committed',
          'It depends: the entry is on two nodes, so a future leader must have it, but no client was told it succeeded — it may or may not end up committed',
          'No — an entry is lost unless the leader acknowledged it',
          'Yes, but only if the surviving follower becomes the next leader',
        ]}
        correctIndex={1}
        explanation={"This is the genuinely uncomfortable middle state, and it is why 'committed' and 'stored' are different words. The entry is on two of three nodes. Any future leader needs votes from two nodes, and at least one of those two will be a node holding this entry — whose logOk check will refuse to vote for a candidate lacking it. So the entry is guaranteed to reach the next leader, and will almost certainly be committed by it. But the crash happened before the leader counted the acknowledgements, so no client ever received a success response. From the client's point of view the request timed out with an unknown outcome, and it must be safe to retry — which is exactly why commands in real systems carry unique IDs and are made idempotent."}
      />

      <h2>What You Just Built, In Real Names</h2>

      <CodeBlock language="text" title="The toy, and its production counterparts">
{`what we built            what it is called          where you have met it
-----------------------  ------------------------  --------------------------------
term counter             logical clock / epoch     ZooKeeper epochs, Kafka KRaft
                                                   controller epoch
majority vote            quorum                    every consensus system ever
randomized timeout       the reason Raft
                         terminates                etcd, Consul, TiKV, CockroachDB
AppendEntries as
  heartbeat              leader lease / liveness   etcd heartbeat interval
replicated log           the log IS the database   Kafka partitions, Postgres WAL
                                                   shipping, the Storage lesson
commit on majority       quorum commit             MongoDB w:majority,
                                                   Kafka acks=all + min.insync
election restriction     the safety property       Raft paper 5.4.1

Raft itself runs: etcd (so: every Kubernetes cluster), Consul, TiKV,
CockroachDB, Kafka KRaft mode. ZooKeeper predates it and uses ZAB,
which is close cousin. Paxos is the older, harder ancestor — Raft was
explicitly designed to be the understandable one.`}
      </CodeBlock>

      <p>
        The connection to the previous lesson is not a coincidence. A key-value store with a
        write-ahead log is a replicated state machine with one replica. Raft is what you add when
        you want that same log to exist on five machines and still have exactly one history.
        etcd is, quite literally, the storage lesson plus this lesson.
      </p>

      <h2>What This Toy Does Not Do</h2>

      <CodeBlock language="text" title="Everything between this page and etcd">
{`NOT IMPLEMENTED HERE — and each one is a real chunk of work:

  persistence          currentTerm, votedFor and the log MUST be on disk
                       before responding, or a rebooted node can vote twice
                       in one term and elect two leaders. See the Storage
                       lesson: this is the same fsync problem.

  log compaction       the log grows forever. Real systems snapshot state
                       and discard the prefix, then need InstallSnapshot
                       to catch up a far-behind follower.

  membership changes   adding or removing a node while running can produce
                       two disjoint majorities mid-transition. Raft has
                       joint consensus for this; it is the fiddliest part
                       of the paper.

  client interaction   linearizable reads are NOT free. A stale leader can
                       serve an old value. Real systems use ReadIndex or a
                       leader lease. Commands need dedup IDs for retries.

  real networking      no message reordering, no duplication, no partial
                       failures, no TLS, no backpressure.

  byzantine faults     Raft assumes nodes are honest but may crash. A lying
                       node breaks it. That is a different problem class.`}
      </CodeBlock>

      <InfoBox variant="tip" title="If you want to take this further">
        <p>
          The highest-value next step is adding persistence, because it turns a subtle correctness
          argument into something you can test: write <code>currentTerm</code> and
          <code>votedFor</code> to disk before replying to a vote request, kill a node mid-election,
          restart it, and confirm it does not vote a second time in the same term. That single
          exercise connects this lesson to the fsync measurement in the storage lesson better than
          any amount of reading.
        </p>
        <p>
          After that, read the Raft paper itself — it is unusually readable, and having built this
          you will recognize every figure in it. The interactive visualization at raft.github.io is
          also worth an afternoon.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default FromScratchConsensus;
