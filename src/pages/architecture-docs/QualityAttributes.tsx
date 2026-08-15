import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function ArchitectureDocsQualityAttributes() {
  return (
    <LessonLayout
      title="Quality Attributes & Trade-off Analysis"
      sectionId="architecture-docs"
      lessonIndex={3}
      prev={{ path: '/architecture-docs/nfrs', label: 'Non-Functional Requirements as a Framework' }}
      next={{ path: '/architecture-docs/stakeholders', label: 'Presenting Architecture to Stakeholders' }}
    >
      <p>
        The previous lesson ended on a tension: the business wants ship-fast, ops wants five-nines,
        security wants defense-in-depth, and all three are pulling on the same system at once.
        That tension was not a sign of a broken process — quality attributes routinely conflict by
        construction, and the actual job of architecture work is making those trade-offs{' '}
        <strong>explicit and deliberate</strong> instead of accidental. An architecture where nobody
        decided the trade-off still made one; it just made it by default, usually in favor of
        whichever attribute the person who happened to write the code that week cared about most.
      </p>

      <h2>Four Trade-offs You Will Hit Repeatedly</h2>

      <p>
        These pairs show up in nearly every system past a certain size, and each one has a real
        mechanism behind it — not just &quot;these sound like opposites.&quot;
      </p>

      <h3>Availability vs. Consistency</h3>
      <p>
        This is the CAP theorem, and this site already has a full treatment of it in the{' '}
        <strong>CAP Theorem Deep Dive</strong> section of the <strong>Distributed Systems</strong>{' '}
        lesson — it is not re-derived here. The short version, as the canonical example of quality
        attributes in genuine tension: during a network partition, a node that cannot reach its
        peers has exactly two options, and no third one. It can refuse to answer until it can
        confirm it has the latest write (consistency, at the cost of availability), or it can answer
        immediately with whatever data it has locally, knowing that data might be stale
        (availability, at the cost of consistency). The mechanism is not a design choice you can
        engineer away — it is a direct consequence of the speed of light and unreliable networks.
      </p>

      <h3>Performance vs. Security</h3>
      <p>
        This site&apos;s <strong>Cryptography</strong> section covers the mechanics of AES, RSA,
        ECC, and TLS in depth — the point here is narrower: every one of those operations has a
        real, measurable cost. A TLS handshake adds network round trips before the first byte of
        application data moves. Encrypting and decrypting a payload burns CPU cycles on every
        request, not once. An MFA check or a token-introspection call adds a network hop to an
        auth service before a request can even reach business logic. None of this is a flaw in the
        controls — it is the price of the guarantee. The trade-off is real: a payments endpoint that
        adds field-level encryption and step-up authentication will have a measurably higher p95
        latency than the same endpoint without them, and that latency has to be budgeted for, not
        wished away.
      </p>

      <h3>Maintainability vs. Time-to-Market</h3>
      <p>
        &quot;Technical debt&quot; is not a synonym for &quot;bad code&quot; — the metaphor, coined
        by Ward Cunningham, was originally about a deliberate, reasoned choice: ship the simpler
        version now to get real-world feedback sooner, on the explicit understanding that the
        shortcut accrues interest and has to be paid down later. The mechanism is genuinely a loan:
        skipping a proper abstraction, hard-coding a config value, or deferring test coverage saves
        real engineering time this sprint, at the cost of every future change to that code taking
        longer. That can be the correct call — an MVP validating a hypothesis before anyone knows if
        the feature is worth building right is a legitimate reason to borrow. It stops being
        legitimate the moment the debt is invisible: undocumented, unscheduled for repayment, and
        discovered by the next engineer as a surprise instead of a known trade-off.
      </p>

      <h3>Scalability vs. Cost</h3>
      <p>
        Headroom is not free. Provisioning for ten times current peak traffic means paying for idle
        compute, redundant database replicas, and multi-region infrastructure every single day that
        traffic does <em>not</em> spike — which, for most systems, is nearly every day. The mechanism
        is a straightforward economic one: you are trading a certain, ongoing cost (extra
        infrastructure spend) against an uncertain, future cost (downtime or throttling during a
        spike you cannot precisely predict the timing of). Whether that trade is worth it depends
        entirely on what an hour of downtime actually costs your business — which is a number worth
        finding out before the architecture decision, not after the outage.
      </p>

      <h2>ATAM: Making Trade-offs Explicit</h2>

      <p>
        The <strong>Architecture Tradeoff Analysis Method (ATAM)</strong> is a real, documented
        evaluation method originating at the Software Engineering Institute (SEI) at Carnegie Mellon
        University, developed by Rick Kazman, Mark Klein, and Paul Clements. It exists to do exactly
        what the trade-offs above demand: systematically evaluate an architecture against multiple,
        competing quality-attribute requirements, with stakeholders in the room, before the
        architecture is expensive to change. SEI&apos;s own materials describe it as a structured,
        multi-day exercise — nine steps across two phases, moving from establishing business drivers
        and architectural approaches, through eliciting quality-attribute scenarios from
        stakeholders, to analyzing how the architecture&apos;s actual decisions hold up against them.
      </p>

      <p>
        ATAM evaluation produces a small, specific vocabulary worth knowing, because it is precise
        in a way that &quot;this feels risky&quot; is not:
      </p>

      <ul>
        <li>
          <strong>Sensitivity point</strong> — an architectural decision that measurably affects one
          particular quality attribute. Change the decision, and that attribute moves.
        </li>
        <li>
          <strong>Trade-off point</strong> — a decision that affects <em>more than one</em> quality
          attribute, often in opposite directions. Adding a cache is a classic trade-off point: it
          helps performance and can hurt consistency at the same time.
        </li>
        <li>
          <strong>Risk</strong> — an architectural decision that is problematic given the quality
          attributes it affects.
        </li>
        <li>
          <strong>Non-risk</strong> — a decision that is appropriate given the quality attributes it
          affects — often a good call that was never written down anywhere.
        </li>
      </ul>

      <p>
        Every sensitivity point and trade-off point ATAM surfaces gets explicitly sorted into a risk
        or a non-risk by the end of the exercise. Nothing stays in limbo as a vague worry — that is
        the entire value of running the method instead of just discussing architecture informally.
      </p>

      <h2>The Quality Attribute Scenario</h2>

      <p>
        ATAM&apos;s core artifact is the <strong>quality attribute scenario</strong> — a fixed,
        six-part structure for writing down a requirement so precisely that two different engineers
        would build the same test for it. The six parts:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Part</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Answers</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Source of stimulus</strong></td>
            <td style={{ padding: '0.75rem' }}>What entity generated the stimulus? A user, another system, a scheduled job, a failure.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Stimulus</strong></td>
            <td style={{ padding: '0.75rem' }}>What condition arrived that the system needs to react to?</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Environment</strong></td>
            <td style={{ padding: '0.75rem' }}>What state was the system in when the stimulus arrived? Normal operation, overload, degraded mode.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Artifact</strong></td>
            <td style={{ padding: '0.75rem' }}>Which part of the system was actually stimulated?</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Response</strong></td>
            <td style={{ padding: '0.75rem' }}>What should the system do about it?</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Response measure</strong></td>
            <td style={{ padding: '0.75rem' }}>How is success measured, in numbers, so the scenario is testable?</td>
          </tr>
        </tbody>
      </table>

      <p>
        Notice this is the same discipline as the vague-to-measurable table in the previous lesson —
        a quality attribute scenario is simply that discipline given a fixed, six-slot template so
        nothing gets left implicit.
      </p>

      <h3>Worked Example: Black Friday Traffic Spike</h3>

      <CodeBlock language="text" title="A Complete Quality Attribute Scenario">
{`Source of stimulus:   A marketing-driven Black Friday sale, driving a large,
                       predictable surge of concurrent shoppers checking out.

Stimulus:              Traffic to the order API increases to 8,000 requests/second
                       (10x normal peak), sustained for a 2-hour window.

Environment:            Normal production operation, during the advertised sale
                       window, with autoscaling enabled.

Artifact:               The Order Service and its backing database.

Response:               The system automatically scales out additional Order
                       Service instances and continues serving checkout requests
                       without manual intervention.

Response measure:       p95 latency stays under 500ms for the entire spike;
                       error rate stays under 0.1%; zero pages to on-call.`}
      </CodeBlock>

      <p>
        That single scenario is specific enough to load-test against today. It also makes the
        trade-off visible: hitting that response measure costs real money in reserved autoscaling
        headroom and load-testing time before the sale — the same scalability-vs-cost trade-off
        covered above, now written down as a decision instead of left as an assumption.
      </p>

      <h2>Decision Table: The Standard Patterns</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Conflict</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Standard pattern</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Accept which side, and when</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Availability vs. Consistency</td>
            <td style={{ padding: '0.75rem' }}>Choose per data path, not per system — reads and writes can make different choices.</td>
            <td style={{ padding: '0.75rem' }}><strong>Availability</strong> for user-facing reads where staleness is harmless (feeds, catalogs). <strong>Consistency</strong> for anything money- or state-changing (payments, inventory counts, seat holds).</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Performance vs. Security</td>
            <td style={{ padding: '0.75rem' }}>Apply expensive controls in proportion to data sensitivity, not uniformly across the whole system.</td>
            <td style={{ padding: '0.75rem' }}><strong>Security</strong> (accept the latency) for regulated or sensitive data — PII, payment details, auth tokens. <strong>Performance</strong> for data that is already public or low-risk.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Maintainability vs. Time-to-Market</td>
            <td style={{ padding: '0.75rem' }}>Take on debt deliberately, document it, and schedule the repayment — don&apos;t let it become invisible.</td>
            <td style={{ padding: '0.75rem' }}><strong>Time-to-market</strong> for genuinely reversible shortcuts validating an unproven idea. <strong>Maintainability</strong> for foundational code many engineers will touch for years.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Scalability vs. Cost</td>
            <td style={{ padding: '0.75rem' }}>Provision for realistic growth plus known burst events, not worst-case-forever.</td>
            <td style={{ padding: '0.75rem' }}><strong>Scalability</strong> (accept the spend) when downtime cost during a spike dwarfs idle-capacity cost (retail on Black Friday). <strong>Cost</strong> (accept the leaner setup) when traffic is steady and occasional throttling is cheap.</td>
          </tr>
        </tbody>
      </table>

      <p>
        None of these rows is a universal answer — they are starting patterns. The actual
        architecture decision is picking a side <em>for your specific system</em> and writing down
        why, ideally as a quality attribute scenario precise enough that the next engineer can tell
        whether the decision is still holding up.
      </p>

      <InteractiveChallenge
        question={"A team decides the checkout flow will use synchronous, strongly-consistent writes to the inventory database — accepting higher latency and reduced availability during a network partition — because selling the last unit of a product twice causes real financial and customer-trust damage. Which trade-off is this, and which side did the team choose?"}
        options={[
          "Performance vs. security — the team chose security",
          "Availability vs. consistency (the CAP theorem trade-off) — the team chose consistency",
          "Maintainability vs. time-to-market — the team chose maintainability",
          "Scalability vs. cost — the team chose cost"
        ]}
        correctIndex={1}
        explanation={"This is the CAP theorem trade-off from the Distributed Systems lesson's CAP Theorem Deep Dive: during a partition, the system can answer immediately with possibly-stale data (availability) or wait until it can confirm the latest state (consistency). Refusing to risk a double-sell by waiting for confirmation is choosing consistency over availability — a defensible choice specifically because double-selling causes real financial damage, which is exactly the kind of reasoning a quality attribute scenario should make explicit."}
      />
    </LessonLayout>
  );
}
