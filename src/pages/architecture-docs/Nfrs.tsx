import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function ArchitectureDocsNfrs() {
  return (
    <LessonLayout
      title="Non-Functional Requirements as a Framework"
      sectionId="architecture-docs"
      lessonIndex={2}
      prev={{ path: '/architecture-docs/c4-model', label: 'The C4 Model for Architecture Diagrams' }}
      next={{ path: '/architecture-docs/quality-attributes', label: 'Quality Attributes & Trade-off Analysis' }}
    >
      <p>
        Every requirements doc eventually splits into two piles, whether or not anyone labels
        them that way. One pile says what the system does. The other says how well it has to do
        it. Confuse the two, or — far more common — write down the first pile and quietly forget
        the second, and you ship something that passes every acceptance test and still falls over
        the first time real traffic hits it. This lesson is about the second pile: what it
        actually contains, why it stays vague until someone forces it into numbers, and where it
        comes from in a real organization.
      </p>

      <h2>Functional vs Non-Functional: What vs How Well</h2>

      <p>
        A <strong>functional requirement</strong> describes a capability: users can reset their
        password, the API returns an order&apos;s current status, an admin can refund a payment. You
        can demo it. A <strong>non-functional requirement</strong> (NFR) describes a property of
        <em> how</em> that capability behaves under real conditions — how fast, how available, how
        secure, how easy to change six months from now, how many concurrent users it survives.
        You cannot demo an NFR in a five-minute walkthrough; you have to measure it.
      </p>

      <InfoBox variant="info" title="The One-Sentence Distinction">
        <p>
          <strong>Functional requirement:</strong> what the system does — &quot;users can reset
          their password.&quot; <strong>Non-functional requirement:</strong> how well it does it —
          how fast, how available, how secure, how easy to change later. Delete every NFR from a
          spec and the system still technically works; it just might take thirty seconds to load,
          fall over under real traffic, or leak customer data the first time someone tries.
        </p>
      </InfoBox>

      <p>
        In practice, &quot;non-functional requirement&quot; and <strong>&quot;quality
        attribute&quot;</strong> are used interchangeably. The software architecture literature
        increasingly prefers &quot;quality attribute&quot; — partly because &quot;non-functional&quot;
        has an unfortunate way of sounding like an afterthought to anyone outside engineering,
        when in reality these properties are usually what actually decides whether an architecture
        succeeds. Expect to see both terms in the wild referring to the same thing: performance,
        availability, security, maintainability, scalability, usability, and the rest of the list
        below.
      </p>

      <h2>ISO/IEC 25010: A Standard Taxonomy, Not a Checklist to Memorize</h2>

      <p>
        You do not have to invent the categories yourself. <strong>ISO/IEC 25010</strong> is a real,
        published international standard — part of the SQuaRE (Systems and software Quality
        Requirements and Evaluation) series — that defines a taxonomy of software product quality
        characteristics. It superseded the older <strong>ISO/IEC 9126</strong> standard when it was
        issued in 2011, specifically because 9126 was considered too narrow and missed emerging
        concerns like security and interoperability. The 2011 revision defines eight top-level
        characteristics:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Characteristic</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>What it's really asking</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Functional Suitability</strong></td>
            <td style={{ padding: '0.75rem' }}>Does it do the right things, completely and correctly?</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Performance Efficiency</strong></td>
            <td style={{ padding: '0.75rem' }}>How well does it use time, CPU, memory, and capacity under load?</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Compatibility</strong></td>
            <td style={{ padding: '0.75rem' }}>Can it coexist and exchange data with other systems without conflict?</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Usability</strong></td>
            <td style={{ padding: '0.75rem' }}>Can the people who actually use it learn it and operate it effectively?</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Reliability</strong></td>
            <td style={{ padding: '0.75rem' }}>Does it keep working — and recover well — under real-world conditions?</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Security</strong></td>
            <td style={{ padding: '0.75rem' }}>Is data and functionality protected from unauthorized access?</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Maintainability</strong></td>
            <td style={{ padding: '0.75rem' }}>How easily can it be understood, modified, fixed, and tested later?</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Portability</strong></td>
            <td style={{ padding: '0.75rem' }}>How easily can it move to a different environment or platform?</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="note" title="ISO/IEC 25010 Keeps Evolving — Treat It as a Checklist, Not Gospel">
        <p>
          The eight-category list above is from ISO/IEC 25010:2011, the version cited in almost
          every architecture book and blog post that references &quot;the ISO quality model.&quot; A
          2023 revision reorganized things further — adding <strong>Safety</strong> as a ninth
          top-level characteristic, and renaming Usability to Interaction Capability and Portability
          to Flexibility. The 2011 names are still what you will encounter in the wild for years to
          come. Either way, the value of the standard is not the exact wording — it is having eight
          or nine named buckets so you don&apos;t silently forget an entire category of requirement
          while eliciting them.
        </p>
      </InfoBox>

      <p>
        If you need the back-of-envelope math for turning a traffic estimate into QPS or a downtime
        percentage into minutes-per-year, that already lives in the <strong>System Design
        Interview</strong> lesson. This lesson is about a different skill: eliciting, writing down,
        and prioritizing these requirements for a system you actually own — on a timeline measured
        in years, not against a 45-minute interview clock.
      </p>

      <h2>Vague to Measurable</h2>

      <p>
        Here is the practical problem with every category in that table: as written by whoever
        first raises it, an NFR is almost always too vague to build against, test against, or hold
        anyone accountable to. &quot;The system should be fast.&quot; &quot;The system should be
        secure.&quot; &quot;The system should be highly available.&quot; None of those sentences
        can fail a code review or a QA gate, because none of them says what &quot;fast,&quot;
        &quot;secure,&quot; or &quot;highly available&quot; actually means. The job is to force
        every one of them into something with a number, a measurement method, and a condition
        attached.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Category</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Vague</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Measurable</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Performance</td>
            <td style={{ padding: '0.75rem' }}>&quot;The system should be fast.&quot;</td>
            <td style={{ padding: '0.75rem' }}>95th percentile API response time under 200ms, sustained at 500 req/s.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Availability</td>
            <td style={{ padding: '0.75rem' }}>&quot;The system should be highly available.&quot;</td>
            <td style={{ padding: '0.75rem' }}>99.95% uptime per month, measured by external synthetic checks every 30s, excluding pre-announced maintenance windows.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Security</td>
            <td style={{ padding: '0.75rem' }}>&quot;The system should be secure.&quot;</td>
            <td style={{ padding: '0.75rem' }}>All PII encrypted at rest (AES-256) and in transit (TLS 1.2+); MFA required for admin access; zero critical/high findings on pen test before each major release.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Maintainability</td>
            <td style={{ padding: '0.75rem' }}>&quot;The codebase should be easy to maintain.&quot;</td>
            <td style={{ padding: '0.75rem' }}>A new engineer ships their first production change within 5 business days of onboarding; CI test suite completes in under 10 minutes.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Scalability</td>
            <td style={{ padding: '0.75rem' }}>&quot;The system should scale.&quot;</td>
            <td style={{ padding: '0.75rem' }}>Handles 10x current peak traffic (5,000 req/s) via horizontal autoscaling with no manual intervention, p95 latency staying under 300ms.</td>
          </tr>
        </tbody>
      </table>

      <p>
        Notice the pattern in the right-hand column: every measurable version has a number, a
        percentile or aggregation method, a load or time condition, and — implicitly — a way to
        fail the test. That is the whole trick. If you cannot describe how you would write an
        automated check or a monitoring alert against the requirement as stated, it is still in the
        vague column, no matter how specific the words sound.
      </p>

      <CodeBlock language="yaml" title="A Measurable NFR, Written as You'd Actually File It">
{`requirement: "Checkout API availability"
metric: "successful_responses / total_requests"
target: ">= 99.9% over a rolling 30-day window"
measurement: "5-minute buckets, evaluated from Prometheus request counters"
excludes: "pre-announced maintenance windows (max 4/quarter, <30 min each)"
owner: "Payments team"
consequence_if_breached: "Page on-call; trigger incident review within 1 business day"`}
      </CodeBlock>

      <h2>Where NFRs Actually Come From</h2>

      <p>
        NFRs rarely arrive from a single stakeholder in a single conversation. Different people
        with different incentives want different — often directly contradictory — things from the
        same system, and eliciting NFRs mostly means surfacing those contradictions before they
        become production incidents instead of after.
      </p>

      <InfoBox variant="warning" title="The Same System, Three Conflicting Requirements">
        <p>
          <strong>The business</strong> wants the checkout flow shipped this quarter, ahead of a
          competitor&apos;s launch — every week of delay has a quantifiable revenue cost.{' '}
          <strong>Ops/SRE</strong> wants five-nines availability on that same flow, because it is
          now the thing the whole company&apos;s revenue depends on — which means more redundancy,
          more testing, more time. <strong>Security</strong> wants defense-in-depth on the same
          payment path — additional authentication steps, tokenization, audit logging — all of
          which add latency and development time that directly work against &quot;ship this
          quarter.&quot; Nobody in that room is wrong. They are each optimizing a real, legitimate
          quality attribute, and the three attributes conflict by construction.
        </p>
      </InfoBox>

      <p>
        This is not a sign that requirements-gathering went badly. It is the actual content of the
        job. A senior engineer moving toward architecture work is expected to surface these
        conflicts explicitly — in writing, with the trade-off named — rather than let each
        stakeholder assume their version won by default. Some practical elicitation habits that
        make this tractable:
      </p>

      <ul>
        <li>
          <strong>Ask every stakeholder group separately, not just once in a shared meeting</strong> —
          business, ops, security, support, legal/compliance, and end users all hold different NFRs,
          and a shared meeting tends to surface only the loudest one.
        </li>
        <li>
          <strong>Convert every answer into the vague-to-measurable form above before it&apos;s
          considered &quot;captured.&quot;</strong> An NFR that cannot be measured cannot be traded
          off against another NFR — you need numbers on both sides of a conflict to reason about it.
        </li>
        <li>
          <strong>Name the conflict out loud when you see one</strong>, rather than quietly picking
          a winner. &quot;Five-nines on this path adds roughly six weeks — do we want that trade,
          or do we accept 99.9% and ship on time?&quot; is a decision stakeholders can actually make
          together.
        </li>
      </ul>

      <p>
        That last habit — naming the conflict and making the trade-off a deliberate, documented
        decision instead of an accident — is the entire subject of the next lesson,{' '}
        <strong>Quality Attributes &amp; Trade-off Analysis</strong>. It gives you a formal method
        (ATAM) and a structured way to write these scenarios down so &quot;fast vs. secure vs.
        available&quot; stops being a shouting match and becomes an explicit, defensible decision.
      </p>

      <InteractiveChallenge
        question={"Product writes this acceptance criterion: \"The reporting dashboard should load quickly for all users.\" Which rewrite actually turns it into a testable non-functional requirement?"}
        options={[
          "\"The reporting dashboard should load quickly, even under heavy load.\"",
          "p95 dashboard load time under 2 seconds for the standard 30-day report, measured click-to-fully-rendered, under a load of 200 concurrent users",
          "\"Add a loading spinner so users know the dashboard is working.\"",
          "\"The dashboard should use Redis caching to improve performance.\""
        ]}
        correctIndex={1}
        explanation={"Option B has a percentile (p95), a concrete threshold (2 seconds), a defined measurement point (click to fully rendered), and a load condition (200 concurrent users) — you could write an automated test or monitoring alert against it today. The other options either restate the vagueness in different words, or jump straight to a specific implementation (a spinner, a caching layer) without ever defining what \"fast\" means — a common trap where a technology gets picked before anyone agrees on the number that technology is supposed to hit."}
      />
    </LessonLayout>
  );
}
