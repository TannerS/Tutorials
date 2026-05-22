import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="System Design Fundamentals"
      sectionId="systemdesign"
      lessonIndex={0}
      prev={null}
      next={{ path: '/systemdesign/scaling', label: 'Scaling &amp; Load Balancing' }}
    >
      {/* ====== Section 1: What is System Design? ====== */}
      <h2>What is System Design?</h2>

      <p>
        System design is the process of defining the architecture, components, modules,
        interfaces, and data flows of a system to satisfy specified requirements. It sits
        at the intersection of software engineering, distributed systems, and product
        thinking &mdash; requiring you to make decisions that balance performance,
        scalability, reliability, and cost.
      </p>

      <p>
        Unlike coding interviews that test your ability to write algorithms on a
        whiteboard, system design interviews evaluate how you think at scale. They test
        whether you can take a vague, open-ended problem &mdash; like &quot;design
        Twitter&quot; or &quot;design a URL shortener&quot; &mdash; and decompose it into
        concrete, buildable components that work together under real-world constraints.
      </p>

      <h3>System Design vs. Coding Interviews</h3>

      <p>
        In a coding interview, there is usually one correct answer (or a small set of
        optimal solutions). System design is fundamentally different: there is no single
        &quot;right&quot; answer. Instead, interviewers look for your ability to navigate
        trade-offs, justify decisions, and communicate clearly. A great system design
        answer demonstrates depth of knowledge and the maturity to say &quot;it
        depends&quot; &mdash; and then explain what it depends on.
      </p>

      <p>
        Coding interviews are about correctness and efficiency of a single algorithm.
        System design interviews are about the correctness and efficiency of an entire
        distributed system composed of many services, databases, caches, and queues
        working in concert.
      </p>

      <InfoBox title="Why System Design Matters for Senior Roles">
        System design is the single most important interview category for senior and
        staff-level engineers. It reveals whether you can think beyond individual
        functions and reason about systems that serve millions of users. Companies use
        it to gauge your ability to lead technical projects, mentor others on
        architecture, and make decisions that affect the entire engineering organization.
      </InfoBox>

      {/* ====== Section 2: Requirements Gathering ====== */}
      <h2>Requirements Gathering</h2>

      <p>
        Every great system design starts with requirements. Jumping straight into
        drawing boxes and arrows without understanding what you are building is the
        fastest way to fail a system design interview. Requirements gathering shows the
        interviewer that you think before you build &mdash; a hallmark of senior
        engineering.
      </p>

      <h3>Functional vs. Non-Functional Requirements</h3>

      <p>
        <strong>Functional requirements</strong> describe what the system should do.
        These are the features and behaviors users interact with directly. For a URL
        shortener, functional requirements might include: creating a short URL from a
        long one, redirecting users who visit the short URL, and optionally allowing
        custom aliases.
      </p>

      <p>
        <strong>Non-functional requirements</strong> describe how the system should
        perform. These include latency targets, availability guarantees, consistency
        models, scalability expectations, and security constraints. For the same URL
        shortener, non-functional requirements might include: redirects must complete
        in under 100ms, the system should be 99.99% available, and short URLs should
        never collide.
      </p>

      <h3>Clarifying Requirements in an Interview</h3>

      <p>
        Always spend the first 3&ndash;5 minutes of a system design interview asking
        clarifying questions. This demonstrates maturity and prevents you from solving
        the wrong problem. Good questions include:
      </p>

      <ul>
        <li>Who are the users? How many are there?</li>
        <li>What are the core features we must support?</li>
        <li>What scale are we designing for? (QPS, storage, users)</li>
        <li>Are there latency requirements?</li>
        <li>What consistency model do we need? (strong vs. eventual)</li>
        <li>Do we need to handle geographic distribution?</li>
        <li>What is the read-to-write ratio?</li>
      </ul>

      <h3>Example: URL Shortener Requirements</h3>

      <p>
        Let&apos;s walk through a concrete example. If asked to &quot;design a URL
        shortener like bit.ly,&quot; here is how you might break down the requirements:
      </p>

      <p><strong>Functional Requirements:</strong></p>
      <ul>
        <li>Given a long URL, generate a unique short URL</li>
        <li>When a user visits the short URL, redirect to the original long URL</li>
        <li>Users can optionally choose a custom short alias</li>
        <li>Short URLs expire after a configurable time period</li>
        <li>Analytics: track the number of clicks per short URL</li>
      </ul>

      <p><strong>Non-Functional Requirements:</strong></p>
      <ul>
        <li>High availability &mdash; the redirect service must be always up</li>
        <li>Low latency &mdash; redirects should happen in under 100ms</li>
        <li>Short URLs should not be predictable (security)</li>
        <li>The system should handle 100M new URLs per month</li>
        <li>Read-heavy workload: 100:1 read-to-write ratio</li>
      </ul>

      <InfoBox title="Always Clarify First">
        Never assume requirements in a system design interview. Even if the problem
        seems obvious, asking clarifying questions shows the interviewer that you
        approach problems methodically. It also gives you time to think and helps you
        scope the problem appropriately for the time available. A well-scoped problem
        is half solved.
      </InfoBox>

      {/* ====== Section 3: Back-of-Envelope Estimation ====== */}
      <h2>Back-of-Envelope Estimation</h2>

      <p>
        Back-of-envelope estimation is the art of making rough but useful calculations
        about system capacity. These calculations help you determine what kind of
        infrastructure you need and whether your design can handle the expected load.
        Interviewers love this because it shows you think quantitatively about systems.
      </p>

      <h3>Why Estimation Matters</h3>

      <p>
        Without estimation, you are designing blind. You might propose a single-server
        architecture for a system that needs to handle 100,000 requests per second, or
        you might over-engineer a system that only serves 100 users. Estimation grounds
        your design in reality and helps you make informed decisions about caching,
        sharding, replication, and other architectural patterns.
      </p>

      <h3>Key Numbers to Know</h3>

      <p>
        When performing estimations, you need to work with three primary metrics:
        <strong>QPS</strong> (Queries Per Second), <strong>storage</strong>, and
        <strong>bandwidth</strong>. QPS tells you how much compute you need. Storage
        tells you how much disk space you need. Bandwidth tells you how much network
        capacity you need.
      </p>

      <h3>Practical Estimation Example</h3>

      <p>
        Let&apos;s estimate the requirements for a Twitter-like service with 300 million
        monthly active users:
      </p>

      <CodeBlock
        language="text"
        title="Twitter-Like Service Estimation"
        code={`=== Traffic Estimation ===
Monthly Active Users (MAU):        300 million
Daily Active Users (DAU):          ~150 million (50% of MAU)
Avg tweets per user per day:       2
Total tweets per day:              150M * 2 = 300 million
Tweets per second (QPS):           300M / 86400 ≈ 3,500 QPS
Peak QPS (2x average):             ~7,000 QPS

=== Read Traffic ===
Avg timeline reads per user/day:   20
Total reads per day:               150M * 20 = 3 billion
Read QPS:                          3B / 86400 ≈ 35,000 QPS
Read-to-Write ratio:               ~10:1

=== Storage Estimation ===
Avg tweet size:                    280 bytes (text only)
Media attachments (20% of tweets): ~500 KB average
Daily text storage:                300M * 280 bytes ≈ 84 GB/day
Daily media storage:               60M * 500 KB ≈ 30 TB/day
5-year text storage:               84 GB * 365 * 5 ≈ 153 TB
5-year media storage:              30 TB * 365 * 5 ≈ 55 PB

=== Bandwidth Estimation ===
Incoming (write):                  84 GB / 86400 ≈ 1 MB/s (text)
Outgoing (read, 10:1 ratio):      ~10 MB/s (text)
Media bandwidth (reads):          Dominated by CDN`}
      />

      <h3>Common Estimation Formulas</h3>

      <ul>
        <li><strong>QPS</strong> = Daily Active Users &times; Actions per user / 86,400</li>
        <li><strong>Peak QPS</strong> = QPS &times; 2 (or &times; 3 for spiky workloads)</li>
        <li><strong>Storage per day</strong> = QPS &times; 86,400 &times; avg object size</li>
        <li><strong>Bandwidth</strong> = QPS &times; avg object size</li>
        <li><strong>Servers needed</strong> = Peak QPS / QPS per server</li>
      </ul>

      <h3>Powers of 2 &amp; Common Data Sizes</h3>

      <table>
        <thead>
          <tr>
            <th>Power</th>
            <th>Value</th>
            <th>Name</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>2^10</td><td>1,024</td><td>1 KB</td><td>A short email</td></tr>
          <tr><td>2^20</td><td>~1 million</td><td>1 MB</td><td>A small image</td></tr>
          <tr><td>2^30</td><td>~1 billion</td><td>1 GB</td><td>A movie file</td></tr>
          <tr><td>2^40</td><td>~1 trillion</td><td>1 TB</td><td>Small database</td></tr>
          <tr><td>2^50</td><td>~1 quadrillion</td><td>1 PB</td><td>Large data warehouse</td></tr>
        </tbody>
      </table>

      <InfoBox title="Estimation Pro Tip">
        Round aggressively during estimation. The goal is not precision &mdash; it is
        to arrive at the right order of magnitude. Saying &quot;about 3,000 QPS&quot;
        is just as useful as saying &quot;3,472 QPS&quot; in a system design interview.
        Focus on whether you need 1 server, 10 servers, or 1,000 servers &mdash; not
        the exact number.
      </InfoBox>

      {/* ====== Section 4: System Design Process Framework ====== */}
      <h2>System Design Process Framework</h2>

      <p>
        Having a structured process for system design interviews is critical. Without a
        framework, it is easy to ramble, go down rabbit holes, or miss important
        aspects of the design. The following four-step process will keep you on track
        and ensure you cover all the bases.
      </p>

      <FlowChart
        title="The 4-Step System Design Process"
        chart={"graph LR\n  A[Step 1:\\nRequirements] --> B[Step 2:\\nHigh-Level Design]\n  B --> C[Step 3:\\nDeep Dive]\n  C --> D[Step 4:\\nBottlenecks &\\nTrade-offs]"}
      />

      <h3>Step 1: Requirements Gathering (5 minutes)</h3>

      <p>
        As discussed above, start by clarifying functional and non-functional
        requirements. Define the scope of the problem. Identify the core use cases
        and the scale you are designing for. Write these down so you can refer back
        to them throughout the interview.
      </p>

      <h3>Step 2: High-Level Design (15 minutes)</h3>

      <p>
        Sketch the major components of the system: clients, load balancers, web
        servers, application servers, databases, caches, and message queues. Define
        the APIs between components. Draw the data flow for each core use case. This
        is where you establish the overall architecture and show that you understand
        how the pieces fit together.
      </p>

      <h3>Step 3: Deep Dive (15 minutes)</h3>

      <p>
        The interviewer will pick one or two areas to explore in depth. This could be
        the database schema, the caching strategy, the data partitioning approach, or
        a specific algorithm. Be prepared to go deep on any component. This is where
        your expertise in specific technologies and patterns shines through.
      </p>

      <h3>Step 4: Bottlenecks &amp; Trade-offs (10 minutes)</h3>

      <p>
        Identify potential bottlenecks in your design and discuss how to address them.
        Talk about trade-offs you made and alternative approaches you considered. This
        step separates good candidates from great ones. Great candidates proactively
        identify weaknesses in their own design and propose mitigations.
      </p>

      <h3>Time Allocation for a 45-Minute Interview</h3>

      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>Duration</th>
            <th>Focus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements</td>
            <td>5 minutes</td>
            <td>Clarify scope, users, scale, constraints</td>
          </tr>
          <tr>
            <td>High-Level Design</td>
            <td>15 minutes</td>
            <td>Components, APIs, data flow diagrams</td>
          </tr>
          <tr>
            <td>Deep Dive</td>
            <td>15 minutes</td>
            <td>Database, caching, algorithms, specific components</td>
          </tr>
          <tr>
            <td>Bottlenecks</td>
            <td>10 minutes</td>
            <td>Failure modes, trade-offs, improvements</td>
          </tr>
        </tbody>
      </table>

      {/* ====== Section 5: Common Building Blocks ====== */}
      <h2>Common Building Blocks</h2>

      <p>
        Every large-scale system is composed of a set of common building blocks. Think
        of these as your architectural vocabulary. Understanding what each component
        does, when to use it, and how it interacts with other components is essential
        for system design interviews.
      </p>

      <h3>Load Balancers</h3>

      <p>
        Load balancers distribute incoming traffic across multiple servers to ensure no
        single server becomes a bottleneck. They improve both availability (if one
        server goes down, traffic is routed to healthy servers) and throughput (more
        servers means more total capacity). Common algorithms include round-robin,
        least connections, and consistent hashing. Examples include NGINX, HAProxy, and
        AWS ALB.
      </p>

      <h3>Caches</h3>

      <p>
        Caches store frequently accessed data in memory to reduce database load and
        improve response times. A well-designed caching layer can reduce database
        queries by 80&ndash;90%. Common caching strategies include cache-aside
        (lazy loading), write-through, and write-behind. Redis and Memcached are the
        most widely used caching solutions.
      </p>

      <h3>Content Delivery Networks (CDNs)</h3>

      <p>
        CDNs are geographically distributed networks of servers that cache static
        content (images, videos, CSS, JavaScript) close to users. They reduce latency
        by serving content from the nearest edge server rather than the origin server.
        CloudFront, Akamai, and Cloudflare are popular CDN providers.
      </p>

      <h3>Databases: SQL vs. NoSQL</h3>

      <p>
        <strong>SQL databases</strong> (PostgreSQL, MySQL) provide ACID guarantees,
        structured schemas, and powerful query languages. They are ideal for
        transactional workloads where data integrity is critical.
      </p>

      <p>
        <strong>NoSQL databases</strong> come in several flavors: key-value stores
        (Redis, DynamoDB), document stores (MongoDB), wide-column stores (Cassandra,
        HBase), and graph databases (Neo4j). They sacrifice some consistency guarantees
        for better scalability and flexibility.
      </p>

      <h3>Message Queues</h3>

      <p>
        Message queues (Kafka, RabbitMQ, SQS) decouple producers from consumers,
        enabling asynchronous processing. They are essential for handling traffic spikes,
        distributing work across workers, and building event-driven architectures.
        Queues provide durability (messages survive server crashes) and back-pressure
        (consumers process at their own rate).
      </p>

      <h3>Search Engines</h3>

      <p>
        Search engines like Elasticsearch and Apache Solr provide full-text search,
        faceted search, and near-real-time indexing. They are built on inverted indices
        and are optimized for read-heavy, search-oriented workloads. If your system
        needs search functionality, a dedicated search engine is almost always the right
        choice over building search into your primary database.
      </p>

      <FlowChart
        title="Typical Web Application Architecture"
        chart={"graph TD\n  Client[Client Browser/App] --> LB[Load Balancer]\n  LB --> WS1[Web Server 1]\n  LB --> WS2[Web Server 2]\n  WS1 --> Cache[Redis Cache]\n  WS2 --> Cache\n  Cache --> DB[Primary Database]\n  DB --> Replica[Read Replica]\n  WS1 --> MQ[Message Queue]\n  MQ --> Worker[Background Workers]\n  Worker --> DB\n  Client --> CDN[CDN - Static Assets]\n  WS1 --> Search[Elasticsearch]\n  WS2 --> Search"}
      />

      {/* ====== Section 6: Latency Numbers ====== */}
      <h2>Latency Numbers Every Programmer Should Know</h2>

      <p>
        Understanding latency numbers helps you reason about where time is spent in
        your system and make informed decisions about caching, data placement, and
        architecture. These numbers, originally compiled by Jeff Dean at Google, are
        essential knowledge for system design.
      </p>

      <table>
        <thead>
          <tr>
            <th>Operation</th>
            <th>Latency</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>L1 cache reference</td>
            <td>0.5 ns</td>
            <td>Fastest memory access</td>
          </tr>
          <tr>
            <td>Branch mispredict</td>
            <td>5 ns</td>
            <td>CPU pipeline stall</td>
          </tr>
          <tr>
            <td>L2 cache reference</td>
            <td>7 ns</td>
            <td>14x slower than L1</td>
          </tr>
          <tr>
            <td>Mutex lock/unlock</td>
            <td>25 ns</td>
            <td>Thread synchronization cost</td>
          </tr>
          <tr>
            <td>Main memory reference</td>
            <td>100 ns</td>
            <td>RAM access</td>
          </tr>
          <tr>
            <td>Compress 1 KB with Zippy</td>
            <td>3,000 ns (3 &mu;s)</td>
            <td>Fast compression</td>
          </tr>
          <tr>
            <td>Send 1 KB over 1 Gbps network</td>
            <td>10,000 ns (10 &mu;s)</td>
            <td>Network transfer</td>
          </tr>
          <tr>
            <td>Read 4 KB randomly from SSD</td>
            <td>150,000 ns (150 &mu;s)</td>
            <td>SSD random read</td>
          </tr>
          <tr>
            <td>Read 1 MB sequentially from memory</td>
            <td>250,000 ns (250 &mu;s)</td>
            <td>Sequential RAM read</td>
          </tr>
          <tr>
            <td>Round trip within same datacenter</td>
            <td>500,000 ns (0.5 ms)</td>
            <td>Intra-DC network</td>
          </tr>
          <tr>
            <td>Read 1 MB sequentially from SSD</td>
            <td>1,000,000 ns (1 ms)</td>
            <td>Sequential SSD read</td>
          </tr>
          <tr>
            <td>HDD seek</td>
            <td>10,000,000 ns (10 ms)</td>
            <td>Mechanical disk seek</td>
          </tr>
          <tr>
            <td>Read 1 MB sequentially from HDD</td>
            <td>20,000,000 ns (20 ms)</td>
            <td>Sequential HDD read</td>
          </tr>
          <tr>
            <td>Send packet CA &rarr; Netherlands &rarr; CA</td>
            <td>150,000,000 ns (150 ms)</td>
            <td>Intercontinental round trip</td>
          </tr>
        </tbody>
      </table>

      <InfoBox title="Why Latency Numbers Matter">
        These numbers inform fundamental design decisions. For example, knowing that a
        RAM access is 100 ns while an HDD seek is 10 ms (100,000x slower) explains why
        caching is so powerful. Knowing that an intercontinental round trip is 150 ms
        explains why CDNs and geo-distributed databases matter. You do not need to
        memorize exact numbers, but understanding the relative magnitudes is crucial
        for reasoning about system performance.
      </InfoBox>

      {/* ====== Section 7: CAP Theorem ====== */}
      <h2>CAP Theorem Introduction</h2>

      <p>
        The CAP theorem, proposed by Eric Brewer in 2000 and proven by Seth Gilbert and
        Nancy Lynch in 2002, states that a distributed data store can provide at most
        two of the following three guarantees simultaneously:
      </p>

      <ul>
        <li>
          <strong>Consistency (C):</strong> Every read receives the most recent write or
          an error. All nodes see the same data at the same time.
        </li>
        <li>
          <strong>Availability (A):</strong> Every request receives a non-error response,
          without guarantee that it contains the most recent write. The system is always
          responsive.
        </li>
        <li>
          <strong>Partition Tolerance (P):</strong> The system continues to operate
          despite network partitions (communication breakdowns between nodes).
        </li>
      </ul>

      <FlowChart
        title="CAP Theorem - Pick Two"
        chart={"graph TD\n  CAP[CAP Theorem] --> C[Consistency:\\nAll nodes see same data]\n  CAP --> A[Availability:\\nEvery request gets a response]\n  CAP --> P[Partition Tolerance:\\nSystem works despite network failures]\n  C --- CP[CP Systems:\\nConsistency + Partition Tolerance]\n  A --- AP[AP Systems:\\nAvailability + Partition Tolerance]\n  C --- CA[CA Systems:\\nConsistency + Availability]"}
      />

      <h3>Why You Can Only Pick Two</h3>

      <p>
        In any distributed system, network partitions are inevitable. Hardware fails,
        cables get cut, and data centers lose connectivity. Because partition tolerance
        is not optional in practice, the real choice in a distributed system is between
        consistency and availability during a partition:
      </p>

      <p>
        <strong>CP systems</strong> choose consistency over availability. When a network
        partition occurs, they will return an error or timeout rather than serve
        potentially stale data. This is the right choice when data correctness is
        critical &mdash; think banking transactions or inventory management.
      </p>

      <p>
        <strong>AP systems</strong> choose availability over consistency. When a network
        partition occurs, they will continue serving requests but may return stale data.
        This is the right choice when uptime matters more than perfect accuracy &mdash;
        think social media feeds or product catalogs.
      </p>

      <h3>Real-World Examples</h3>

      <p><strong>CP Systems (Consistency + Partition Tolerance):</strong></p>
      <ul>
        <li>
          <strong>MongoDB</strong> (with majority write concern) &mdash; prioritizes
          consistency by requiring writes to be acknowledged by a majority of replicas
        </li>
        <li>
          <strong>HBase</strong> &mdash; built on HDFS, provides strong consistency with
          a single master per region
        </li>
        <li>
          <strong>Zookeeper</strong> &mdash; a coordination service that guarantees
          linearizable reads and writes
        </li>
      </ul>

      <p><strong>AP Systems (Availability + Partition Tolerance):</strong></p>
      <ul>
        <li>
          <strong>Cassandra</strong> &mdash; designed for high availability with tunable
          consistency levels, defaults to eventual consistency
        </li>
        <li>
          <strong>DynamoDB</strong> &mdash; Amazon&apos;s highly available key-value
          store that prioritizes availability and uses eventual consistency by default
        </li>
        <li>
          <strong>CouchDB</strong> &mdash; uses multi-version concurrency control and
          eventual consistency via replication
        </li>
      </ul>

      <InfoBox title="CAP Theorem Nuance">
        The CAP theorem is often oversimplified. In practice, modern databases offer
        tunable consistency &mdash; you can adjust the consistency level per query. For
        example, Cassandra lets you choose between ONE, QUORUM, and ALL consistency
        levels. DynamoDB offers both eventually consistent and strongly consistent
        reads. The real skill is understanding when to use which consistency level for
        different parts of your system.
      </InfoBox>

      <InteractiveChallenge
        question={"A social media platform needs to display user feeds across multiple data centers. During a network partition between data centers, the team decides that users should still be able to see their feeds, even if the content might be slightly outdated. Which CAP theorem trade-off is this system making?"}
        options={[
          'CP — Choosing consistency over availability',
          'AP — Choosing availability over consistency',
          'CA — Choosing consistency over partition tolerance',
          'CAP — Achieving all three guarantees simultaneously',
        ]}
        correctIndex={1}
        explanation={"This is an AP (Availability + Partition tolerance) system. By allowing users to see potentially stale feeds during a network partition, the system prioritizes availability over strict consistency. This is a common and appropriate trade-off for social media platforms where showing slightly outdated content is far better than showing an error page. Strong consistency would require waiting for all data centers to agree, which would make the system unavailable during partitions."}
      />

      {/* ====== Section 8: Estimation Challenge ====== */}
      <h2>Test Your Knowledge</h2>

      <p>
        Now that you have learned the fundamentals of system design, let&apos;s test
        your understanding of requirements gathering and estimation with a practical
        challenge.
      </p>

      <InteractiveChallenge
        question={"You are designing a photo-sharing service with 50 million daily active users. Each user uploads an average of 2 photos per day, and each photo is 2 MB. What is the approximate daily storage requirement for new photos?"}
        options={[
          '10 TB per day',
          '50 TB per day',
          '100 TB per day',
          '200 TB per day',
        ]}
        correctIndex={3}
        explanation={"Daily storage = 50 million users × 2 photos/user × 2 MB/photo = 200 million MB = 200 TB per day. This kind of back-of-envelope estimation is critical in system design interviews. It immediately tells you that you need a distributed storage system (like S3 or HDFS), a CDN for serving images, and a strategy for data retention and archival. A single server simply cannot handle this volume of data."}
      />
    </LessonLayout>
  );
}
