import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function FromScratchIntro() {
  return (
    <LessonLayout
      title="Why Build the Thing You Already Use"
      sectionId="from-scratch"
      lessonIndex={0}
      prev={null}
      next={{ path: '/from-scratch/scheduler', label: 'Build a Task Scheduler' }}
    >
      <h2>A Different Axis</h2>
      <p>
        Every other section on this site teaches you how to <em>use</em> something: a
        framework, a library, a protocol, a query language. That is the right way to learn
        most things, and it is how you get productive. But it leaves a residue &mdash; a set
        of behaviours you have memorised without being able to derive. You know that{' '}
        <code>shutdownNow()</code> is worse than <code>shutdown()</code>. You know Spring&apos;s
        default scheduler pool has one thread. You know a bounded queue is safer than an
        unbounded one. You know these the way you know a phone number: as facts, not as
        consequences.
      </p>
      <p>
        This section runs on the opposite axis. You build a small, working, deliberately
        incomplete version of a thing you already consume. The point is not the artifact.
        The point is that afterwards, those memorised facts stop being arbitrary, because
        you have stood in the position of the person who had to make that trade-off.
      </p>

      <h2>Fifteen APIs, Five Primitives</h2>
      <p>
        Look at what this site has already taught you, and notice how few distinct ideas
        are underneath it. Almost everything in the concurrency, Spring, messaging, and
        distributed-systems lessons is one of five primitives wearing a different name:
      </p>

      <table>
        <thead>
          <tr>
            <th>Primitive</th>
            <th>APIs you already know that are built on it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>A queue</strong></td>
            <td>
              <code>BlockingQueue</code>, <code>ExecutorService</code>&apos;s work queue,
              Kafka topic partitions, a message broker, the event loop&apos;s task queue,
              a connection pool&apos;s waiter list
            </td>
          </tr>
          <tr>
            <td><strong>A lock</strong></td>
            <td>
              <code>synchronized</code>, <code>ReentrantLock</code>, a database row lock,
              <code>SELECT ... FOR UPDATE</code>, a distributed lock (Shedlock, Redis),
              an optimistic <code>@Version</code> column
            </td>
          </tr>
          <tr>
            <td><strong>A worker pool</strong></td>
            <td>
              <code>ThreadPoolExecutor</code>, <code>ThreadPoolTaskExecutor</code>,
              HikariCP, a servlet container&apos;s request threads, an nginx worker set
            </td>
          </tr>
          <tr>
            <td><strong>A state machine</strong></td>
            <td>
              A circuit breaker (closed/open/half-open), a TCP connection, a
              <code>Future</code>, a saga, Raft&apos;s follower/candidate/leader,
              a transaction&apos;s lifecycle
            </td>
          </tr>
          <tr>
            <td><strong>An append-only log</strong></td>
            <td>
              A database WAL, Kafka itself, event sourcing, a replicated Raft log,
              Git&apos;s object store, a redo log
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        That is not a metaphor or a mnemonic; it is literally the same data structure with
        different failure semantics bolted on. Once you have written the queue and the pool
        yourself, &ldquo;why does <code>maxPoolSize</code> never get reached?&rdquo; is not
        a piece of Spring trivia any more. It is a thing you can re-derive at a whiteboard
        in twenty seconds, because you remember the order the code checks things in.
      </p>

      <InfoBox variant="note" title="Measured against this site, not asserted">
        <p>
          These primitives are not evenly interesting &mdash; they are load-bearing in
          proportion to how often the rest of the site leans on them. Counting lesson files
          in this repo: <strong>&ldquo;virtual thread&rdquo; appears in 14 lessons</strong>,{' '}
          <strong><code>@Async</code> in 11</strong>,{' '}
          <strong>&ldquo;circuit breaker&rdquo; in 10</strong>,{' '}
          <strong><code>ExecutorService</code> in 5</strong>, and{' '}
          <strong><code>@Scheduled</code> in 5</strong>. A scheduler &mdash; a queue plus a
          pool plus a state machine &mdash; is the thing sitting underneath all of them.
          That is why it is the first project rather than an arbitrary choice.
        </p>
      </InfoBox>

      <h2>The Four Projects</h2>

      <FlowChart
        title="What each project is, and which parts of this site it explains"
        chart={"graph LR\n  FS[\"Build From Scratch\"] --> P1[\"1. Task Scheduler<br/>queue + pool + lifecycle\"]\n  FS --> P2[\"2. KV Store with a WAL<br/>append-only log + fsync\"]\n  FS --> P3[\"3. HTTP Server from Sockets<br/>parser + connection lifecycle\"]\n  FS --> P4[\"4. Raft<br/>replicated log + quorum\"]\n\n  P1 --> A1[\"Java: Concurrency and Threads\"]\n  P1 --> A2[\"Spring Boot: Advanced - Async and Scheduled\"]\n  P1 --> A3[\"Spring Boot Field Guide: AOP and Async Events\"]\n\n  P2 --> B1[\"PostgreSQL Advanced: Transactions and Locking\"]\n  P2 --> B2[\"System Design: Databases and Caching\"]\n  P2 --> B3[\"Spring Boot: Kafka\"]\n\n  P3 --> C1[\"API Design: REST, Methods, WebSockets\"]\n  P3 --> C2[\"Microservices: Service Communication\"]\n  P3 --> C3[\"Cryptography: TLS and HTTPS\"]\n\n  P4 --> D1[\"System Design: Distributed Systems\"]\n  P4 --> D2[\"Microservices: Event-Driven Architecture\"]\n  P4 --> D3[\"Microservices: Core Patterns\"]\n\n  style FS fill:#3d1f33,stroke:#f472b6\n  style P1 fill:#1a2744,stroke:#5b9cf6\n  style P2 fill:#1a2744,stroke:#5b9cf6\n  style P3 fill:#1a2744,stroke:#5b9cf6\n  style P4 fill:#1a2744,stroke:#5b9cf6"}
      />

      <h3>1. A Task Scheduler</h3>
      <p>
        Roughly 300 lines of Java that ends up being a recognisable{' '}
        <code>ThreadPoolExecutor</code>. You start with a thread per task, measure exactly
        where that falls over, then replace it with a fixed pool over a{' '}
        <code>BlockingQueue</code>, then discover that your choice of queue silently decides
        your entire scaling behaviour.
      </p>
      <p>
        <strong>What it explains:</strong>{' '}
        <a href="/java/concurrency">Java &rarr; Concurrency &amp; Threads</a> and{' '}
        <a href="/java/cheatsheet">Java Field Guide &rarr; Concurrency &amp; Virtual Threads</a>{' '}
        stop being an API tour. <a href="/springboot/advanced">Spring Boot &rarr; Advanced Topics</a>{' '}
        tells you the default <code>@Scheduled</code> pool size is 1 and that this is
        dangerous; after project 1 you know precisely what queue that single thread is
        draining and why a hung job stops the world.{' '}
        <a href="/springboot/cheatsheet">Spring Boot Field Guide &rarr; AOP, Async &amp; Events</a>{' '}
        documents the <code>applicationTaskExecutor</code> footgun &mdash; an effectively
        unbounded queue means <code>maxPoolSize</code> is never reached. Step 3 of the
        scheduler project makes you build the bug yourself.
      </p>

      <h3>2. A Key-Value Store with a Write-Ahead Log</h3>
      <p>
        An append-only file, an in-memory index over it, and a recovery path that replays
        the log after a crash. Then the uncomfortable part: proving to yourself that a
        write is not durable until <code>fsync</code> returns, and measuring what that
        costs.
      </p>
      <p>
        <strong>What it explains:</strong>{' '}
        <a href="/sql-advanced/transactions">SQL Advanced &rarr; Transactions &amp; Locking</a> &mdash;
        the D in ACID is this file. <a href="/systemdesign/databases">System Design &rarr; Database Design &amp; Scaling</a>{' '}
        and <a href="/systemdesign/caching">Caching Strategies</a> &mdash; write-through vs
        write-behind is a decision about when you append and when you flush.{' '}
        <a href="/springboot/kafka">Spring Boot &rarr; Kafka in Spring</a> &mdash; Kafka is
        essentially this log with a network protocol and partitions in front of it, which is
        why offsets behave the way they do.
      </p>

      <h3>3. An HTTP Server from Sockets</h3>
      <p>
        A <code>ServerSocket</code>, a request parser, and a connection lifecycle. The
        interesting failures are all in the lifecycle: when do you close, when do you keep
        alive, what happens to a half-written response, and how does a slow client tie up a
        worker.
      </p>
      <p>
        <strong>What it explains:</strong>{' '}
        <a href="/apidesign/methods">API Design &rarr; HTTP Methods &amp; Status Codes</a> and{' '}
        <a href="/apidesign/websockets">WebSockets &amp; Real-Time APIs</a> &mdash; the upgrade
        handshake is obvious once you have written the parser it hijacks.{' '}
        <a href="/microservices/communication">Microservices &rarr; Service Communication</a> &mdash;
        connection pooling, timeouts, and head-of-line blocking are properties of this loop.{' '}
        <a href="/cryptography/tls">Cryptography &rarr; TLS &amp; HTTPS</a> &mdash; TLS is a
        layer you slot between the socket and the parser, and building the plain version
        first makes that boundary visible.
      </p>

      <h3>4. Raft: Leader Election and Log Replication</h3>
      <p>
        Three nodes, a term counter, and a replicated log. This is where the state machine
        primitive stops being a diagram and becomes code you can make fail by unplugging a
        node mid-test.
      </p>
      <p>
        <strong>What it explains:</strong>{' '}
        <a href="/systemdesign/distributed">System Design &rarr; Distributed Systems</a> &mdash;
        quorum, split-brain, and CAP become mechanical rather than philosophical.{' '}
        <a href="/microservices/events">Microservices &rarr; Event-Driven Architecture</a> and{' '}
        <a href="/microservices/patterns">Core Patterns</a> &mdash; the saga, the outbox, and
        exactly-once delivery are all arguments about a replicated log and what a node knows
        after a partition heals.
      </p>

      <h2>These Are Teaching Toys. Do Not Ship Them.</h2>
      <p>
        Each project is roughly 200&ndash;400 lines. The real versions are 20,000 to
        2,000,000. That gap is not padding, and it is not enterprise bloat &mdash; it is
        almost entirely the handling of cases that only show up under real load, real
        hardware failure, or real adversarial input. Being specific about what is missing is
        part of the lesson, because &ldquo;I built a Raft&rdquo; is only an honest sentence
        if you can name what you left out.
      </p>

      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Deliberately missing &mdash; and this is what makes the real one hard</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Scheduler</td>
            <td>
              Work stealing. Per-worker queues (our single shared queue is a contention
              point at high core counts). Rejection policies beyond one. Backpressure
              signalling to the producer. <code>ForkJoinPool</code>&apos;s
              continuation-stealing. Thread-local recycling. Any observability at all &mdash;
              no queue-depth metric, no task-latency histogram. A real pool also handles
              <code>Error</code> escaping a task without killing the worker permanently.
            </td>
          </tr>
          <tr>
            <td>KV store</td>
            <td>
              Compaction and log segmentation, so the file grows forever. Checksums, so a
              torn write on power loss is undetectable. Crash-consistency of the index
              itself. Range scans. Concurrent readers during recovery. Anything resembling
              an LSM tree&apos;s levelled merge, which is where all the real engineering is.
            </td>
          </tr>
          <tr>
            <td>HTTP server</td>
            <td>
              Chunked transfer encoding. Request-smuggling defences (this is a genuine
              security hazard, not a nicety). Header size limits and slowloris protection.
              HTTP/2 multiplexing. Any correct handling of malformed input, which is most of
              what a hardened parser is.
            </td>
          </tr>
          <tr>
            <td>Raft</td>
            <td>
              Log compaction and snapshots. Membership changes (joint consensus), which is
              the single hardest part of the paper. Persistent state that survives a real
              crash rather than a simulated one. Client session tracking for exactly-once
              semantics. Read-only query optimisations like lease reads.
            </td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="danger" title="Say this out loud once">
        <p>
          A from-scratch implementation of a well-known primitive is the most tempting thing
          in software to over-trust, because it works on your machine on the happy path and
          you understand every line. The reason to use the real{' '}
          <code>ThreadPoolExecutor</code> is not that you could not have written it &mdash;
          it is that the real one has absorbed twenty years of bug reports from workloads you
          have never seen. Build these to understand. Then delete them and use the library.
        </p>
      </InfoBox>

      <h2>How to Use This Section</h2>
      <p>
        These lessons are structured as build-alongs, not as reading. They are worth
        substantially less if you skim them, and the reason is specific: the whole value is
        in the moment where your version behaves differently from what you predicted. You
        cannot get that from reading the output someone else pasted.
      </p>
      <ul>
        <li>
          <strong>Type the code, do not paste it.</strong> Every snippet is short enough to
          type. Typing forces you past the parts your eye skips, and the parts your eye skips
          are exactly the ordering decisions that matter (which check happens before which).
        </li>
        <li>
          <strong>Run every step.</strong> Each step in each project compiles and runs on its
          own. If a step does not run, that is the lesson &mdash; find out why before moving
          on.
        </li>
        <li>
          <strong>Predict before you run.</strong> Before each measurement, write down the
          number you expect. Being wrong is the signal; it tells you which part of your model
          is fabricated.
        </li>
        <li>
          <strong>Break it on purpose.</strong> Every project ends with things to sabotage:
          remove the bound on the queue, kill the process mid-write, drop a node, send a
          malformed header. A system you have only seen succeed is a system you do not
          understand.
        </li>
      </ul>

      <CodeBlock language="bash" title="You need almost nothing to run these">
{`# Java 21+ is required (virtual threads, and single-file source launch).
# The measurements in this section were taken on JDK 26.
$ java -version

# Single-file source-code launch: no build tool, no project, no pom.xml.
# Every step in this section is one file that runs directly.
$ java Step1Naive.java

# When a step needs several files, compile them together first:
$ javac *.java -d out && java -cp out Main`}
      </CodeBlock>

      <InfoBox variant="warning" title="About the numbers in this section">
        <p>
          Every measurement in these lessons was produced by compiling and running the code
          on the machine that wrote them &mdash; JDK 26.0.1 on an Apple M4 Pro (14 cores,
          48&nbsp;GB) under macOS 26.5. The outputs are pasted, not paraphrased.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Your numbers will differ, and some will differ a lot.</strong> Timings scale
          with your CPU. Thread limits are an operating-system property and vary by platform
          and by <code>ulimit</code>. Where a number is machine-dependent, the lesson says so
          and tells you the <em>shape</em> to look for &mdash; &ldquo;linear in N&rdquo;,
          &ldquo;falls off a cliff&rdquo;, &ldquo;flat until the queue fills&rdquo; &mdash;
          because the shape is the thing that transfers. If your absolute numbers differ but
          the shape matches, you reproduced the result.
        </p>
      </InfoBox>

      <p>
        Start with the scheduler. It is the shortest, it is the one the rest of this site
        leans on hardest, and its first step fails in a way that is genuinely worth
        measuring.
      </p>
    </LessonLayout>
  );
}

export default FromScratchIntro;
