import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SysdesignInterview() {
  return (
    <LessonLayout
      title="System Design Interview"
      sectionId="systemdesign"
      lessonIndex={6}
      prev={{ path: "/systemdesign/messaging", label: "Messaging Systems" }}
      next={{ path: "/typescript/intro", label: "TypeScript Introduction" }}
    >
      <p>System design interviews test your ability to design large-scale systems under time pressure. The key is a structured approach: clarify requirements, estimate scale, design the API, choose data stores, sketch the architecture, and discuss trade-offs.</p>
      <CodeBlock language="bash" title="System Design Interview Template">
{`# === STEP 1: CLARIFY REQUIREMENTS (5 min) ===
# Functional: What features? Read-heavy or write-heavy?
# Non-functional: Scale? Latency? Consistency? Availability?
# Out of scope: What don't we need to design?

# === STEP 2: ESTIMATE SCALE (5 min) ===
# Daily active users (DAU)
# Requests per second (DAU × requests/day ÷ 86,400)
# Storage: items × item size × retention period
# Bandwidth: RPS × response size

# === STEP 3: API DESIGN (5 min) ===
# POST /api/tweets   — create tweet
# GET  /api/tweets/{id}
# GET  /api/feed?userId=X — home timeline

# === STEP 4: DATA MODEL (5 min) ===
# Users: id, username, followers_count
# Tweets: id, user_id, content, created_at
# Follows: follower_id, following_id

# === STEP 5: HIGH-LEVEL DESIGN (10 min) ===
# Draw: clients → CDN → load balancer → app servers → cache → DB
# Identify the bottleneck: usually DB or cache

# === STEP 6: DEEP DIVE (10 min) ===
# Focus on the hardest part: fan-out, consistency, hot spots
# Twitter feed: push vs pull model for timeline generation
# URL shortener: hash collision, redirect performance

# === COMMON SYSTEMS TO PRACTICE ===
# URL Shortener, Rate Limiter, Notification System,
# Twitter Timeline, YouTube, Uber, Design a Cache (Memcached),
# Design a Message Queue, Web Crawler, Search Autocomplete`}
      </CodeBlock>
      <InfoBox variant="tip" title="Interview Anti-Patterns">
        <p>Don't jump to solutions before clarifying requirements. Don't design in silence — talk through your reasoning. Don't over-engineer — start simple and add complexity only where needed. Don't ignore trade-offs — interviewers want to see you understand the cost of every decision. Always estimate before choosing architecture.</p>
      </InfoBox>
      <InteractiveChallenge
        question="In a URL shortener, what is the most important performance optimization for the redirect endpoint?"
        options={["Use a faster programming language", "Cache short-to-long URL mappings in Redis — redirects are read-heavy and cache hit rates will be very high", "Use a more powerful database", "Pre-compute all redirects at creation time"]}
        correctIndex={1}
        explanation="URL shorteners are extremely read-heavy (many redirects per creation). The redirect path (GET /{shortCode} → 301/302 to long URL) must be fast. Caching short codes in Redis means most redirects never hit the database — a typical shortener can serve millions of redirects/second from cache with minimal DB load."
      />

    </LessonLayout>
  );
}
