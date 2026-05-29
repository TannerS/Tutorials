import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SysdesignIntro() {
  return (
    <LessonLayout
      title="System Design Fundamentals"
      sectionId="systemdesign"
      lessonIndex={0}
      prev={{ path: "/devops/monitoring", label: "Monitoring" }}
      next={{ path: "/systemdesign/scaling", label: "Scaling Patterns" }}
    >
      <p>System design is the process of defining architecture for large-scale systems. Interviewers and senior engineers think about: requirements, scale estimates, data models, API design, and trade-offs between consistency, availability, and partition tolerance (CAP theorem).</p>
      <FlowChart title="System Design Framework" chart={"graph TD\n  A[Requirements] --> B[Estimate Scale]\n  B --> C[API Design]\n  C --> D[Data Model]\n  D --> E[High-Level Architecture]\n  E --> F[Deep Dive Components]\n  F --> G[Trade-offs]"} />
      <CodeBlock language="java" title="Scale Estimation Cheat Sheet">
{`// Numbers every engineer should know
// Latency:
//   L1 cache:        0.5 ns
//   RAM:             100 ns
//   SSD read:        100 μs
//   Network roundtrip (same DC): 0.5 ms
//   Network roundtrip (cross-country): 150 ms
//   HDD seek:        10 ms

// Throughput:
//   Single MySQL: ~1,000 writes/sec,  ~10,000 reads/sec
//   Single Redis: ~100,000 ops/sec
//   Single Kafka: ~1,000,000 msgs/sec

// Storage:
//   1 million users × 1KB profile = 1 GB
//   1 billion tweets × 280 chars  = 280 GB
//   1 hour HD video                = 1 GB

// Quick estimate for 10 million DAU:
//   10M DAU × 10 requests/day = 100M req/day
//   100M / 86,400 seconds     = ~1,200 req/sec
//   Peak (3× average)         = ~3,600 req/sec
//   → Need at minimum 4-10 application servers`}
      </CodeBlock>
      <InfoBox variant="tip" title="CAP Theorem">
        <p>In distributed systems, you can only guarantee two of three: Consistency (every read gets the latest write), Availability (every request gets a response), Partition Tolerance (system works despite network splits). Since network partitions happen, you choose CP (banking — consistent but may be unavailable) or AP (social media — always available but possibly stale).</p>
      </InfoBox>
      <InteractiveChallenge
        question="A URL shortener gets 100 million new URLs per day. Roughly how many writes per second is that?"
        options={["About 116", "About 1,160", "About 11,600", "About 1.16 million"]}
        correctIndex={1}
        explanation="100 million / 86,400 seconds per day ≈ 1,157 writes/second, roughly 1,160. This is a manageable rate for a single optimized database, but with read traffic likely 10-100× higher (reads >> writes for a URL shortener), you'd add caching and read replicas."
      />

    </LessonLayout>
  );
}
