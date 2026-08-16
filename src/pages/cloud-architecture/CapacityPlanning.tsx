import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CloudArchitectureCapacityPlanning() {
  return (
    <LessonLayout
      title="Cost & Capacity Planning"
      sectionId="cloud-architecture"
      lessonIndex={3}
      prev={{ path: '/cloud-architecture/multi-region', label: 'Multi-Region Architecture & Disaster Recovery' }}
      next={{ path: '/cloud-architecture/cicd', label: 'CI/CD Pipelines & Deployment Strategies' }}
    >
      <p>
        The Estimation Cheat Sheet in the System Design Interview lesson covers this same back-of-envelope
        math — DAU, QPS, storage, bandwidth — as a way to demonstrate reasoning under interview pressure.
        This lesson is the same arithmetic, but the framing is genuinely different in a way worth being
        explicit about: an interviewer forgives an aggressively rounded number and rewards speed over
        precision. A purchasing decision does not forgive anything. Get the estimate wrong in an interview
        and you lose a few points; get it wrong here and the failure mode is either an outage from
        under-provisioning or a real invoice from over-provisioning. The technique is identical — users
        &rarr; actions &rarr; requests/second &rarr; resources — what changes is that the number now has to
        survive contact with production traffic and a monthly bill, not just a whiteboard.
      </p>

      <h2>Capacity Math for Real: A Worked Example</h2>

      <p>
        Say you&apos;re planning capacity for a service with <strong>2 million daily active users</strong>,
        each making an average of <strong>20 API requests per day</strong>, and — based on real traffic
        logs, ideally, not a guess — peak traffic runs at roughly <strong>3&times; the daily average</strong>,
        concentrated in a 4-hour window. That is four input numbers. Everything past this point is
        arithmetic, and the point of this section is to actually do it rather than wave at it:
      </p>

      <CodeBlock language="text" title="Worked Example: Sizing for Peak Load">
{`ASSUMPTIONS (stated explicitly — these are inputs you plug in, not universal constants)
  Daily active users (DAU):        2,000,000
  Avg requests per user per day:   20
  Peak multiplier:                 3x the daily average
  Peak window:                     4 hours

STEP 1 — Total daily requests
  2,000,000 users * 20 requests/user/day = 40,000,000 requests/day

STEP 2 — Average requests/second (spread across the full day)
  1 day = 86,400 seconds
  40,000,000 / 86,400 ≈ 462.96 → ~463 req/s average

STEP 3 — Peak requests/second
  463 req/s * 3 ≈ 1,389 req/s at peak

  Sanity check — does "3x average, 4-hour window" even hold together?
  A 4-hour window is 4/24 = 1/6 of the day. If the peak rate (3x average)
  held steady for that entire window, the window alone would carry:
    3 * (window fraction of day) = 3 * (1/6) = 1/2 of the day's total traffic.
  So this assumption implies half of all daily requests land in one-sixth
  of the day. That's a believable shape for a consumer app with an evening
  or business-hours spike — but it's a claim to check against real logs,
  not a multiplier to assume out of habit.

STEP 4 — Servers needed at peak
  Assumption: one instance sustainably handles 200 req/s for this workload.
  (This number is an ASSUMPTION, not a fact — load-test your own endpoint.
  A cached read and a request that fans out to three downstream services
  are not the same 200 req/s.)
  1,389 / 200 ≈ 6.94 → round up to 7 instances (bare minimum, zero headroom)

STEP 5 — Add headroom for failover and short-term growth
  7 instances * 1.3 (30% headroom) = 9.1 → round up to 10 instances

RESULT: ~10 instances, sized for peak load.
Sizing for the 463 req/s average instead of the ~1,389 req/s peak would
leave the service roughly 3x under-provisioned the instant peak traffic
actually arrives.`}
      </CodeBlock>

      <p>
        Notice what actually did the work: multiplication, division, and one ratio — nothing else. The
        number &quot;10 instances&quot; is not the point, and it will be wrong for your service; the{' '}
        <em>method</em> is the point. Users &rarr; requests/day &rarr; requests/second (average) &rarr;
        requests/second (peak) &rarr; instances &rarr; instances with headroom is a five-step chain you can
        rerun for any workload, as long as you&apos;re honest with yourself about which numbers in it are
        measured and which are still assumptions.
      </p>

      <h2>Reserved vs. On-Demand vs. Spot</h2>

      <p>
        Once you know roughly how many instances you need — the 7-to-10 range from the example above — the
        next question is how to <em>pay</em> for them. Cloud providers sell the same underlying compute
        capacity under three different pricing models, and reaching for the wrong one for a given workload
        is either an expensive habit or an outage waiting to happen.
      </p>

      <ul>
        <li>
          <strong>On-demand</strong> — pay per second or hour of actual use, no commitment, cancel anytime.
          It is the most expensive per-hour of the three, because you are paying for the flexibility of
          walking away at any moment.
        </li>
        <li>
          <strong>Reserved / committed-use</strong> — commit to running an instance, or a certain amount of
          compute, for a fixed term (typically 1&ndash;3 years) in exchange for a meaningfully lower hourly
          rate. The discount is real — order-of-magnitude, expect somewhere from roughly a third off to
          well over half off the on-demand rate — but the exact percentage depends on provider, term
          length, region, and payment option, and it shifts over time as providers change their pricing.
          Treat any specific percentage you read, including the range in this sentence, as a rough shape to
          budget around, not a number to lock into a spreadsheet without checking current pricing.
        </li>
        <li>
          <strong>Spot / preemptible</strong> — request the provider&apos;s spare, currently-unused capacity
          at a steep discount (again order-of-magnitude — often the deepest discount of the three). The
          catch is the entire deal: the provider can reclaim that capacity with short notice — commonly on
          the order of a couple of minutes&apos; warning — whenever it needs it for a paying on-demand or
          reserved customer. You are not renting a guaranteed instance; you are borrowing whatever happens
          to be idle right now, on the explicit condition that it can be taken back.
        </li>
      </ul>

      <InfoBox variant="danger" title="Why Spot Is Wrong for a Stateful Primary Database">
        <p>
          The reclaim mechanism is the whole reason spot is cheap, and it is exactly why it is the wrong
          choice for anything that cannot tolerate its only running instance disappearing on short notice.
          A worker processing a batch queue can checkpoint its progress, get interrupted, and resume on a
          fresh instance a minute later — the work is idempotent and nothing downstream even notices. A
          stateful primary database with no standby has no equivalent move: reclaim it mid-transaction and
          the result is an outage, not a retry. Spot is for workloads where interruption costs you a delay.
          It is never for workloads where interruption costs you availability.
        </p>
      </InfoBox>

      <h3>Decision Table</h3>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Workload characteristic</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Fits</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Because</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Steady, predictable baseline load running 24/7 (the floor of your web tier)</td>
            <td style={{ padding: '0.75rem' }}><strong>Reserved / committed-use</strong></td>
            <td style={{ padding: '0.75rem' }}>You know you&apos;ll use it for the full term, so you may as well collect the discount</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>New service, or a load pattern you don&apos;t have real history on yet</td>
            <td style={{ padding: '0.75rem' }}><strong>On-demand</strong></td>
            <td style={{ padding: '0.75rem' }}>You can&apos;t honestly commit to a 1&ndash;3 year term for a number you&apos;re still guessing at</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Fault-tolerant, interruptible batch or background work (pipelines, CI runners, rendering)</td>
            <td style={{ padding: '0.75rem' }}><strong>Spot / preemptible</strong></td>
            <td style={{ padding: '0.75rem' }}>Interruption costs a retry, not an outage — so take the deepest discount available</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Stateful primary database, or anything with no standby to fail over to</td>
            <td style={{ padding: '0.75rem' }}><strong>On-demand or reserved</strong> — never spot</td>
            <td style={{ padding: '0.75rem' }}>Losing the only running instance, even briefly, is an outage — you need an uptime guarantee, not borrowed capacity</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Short-lived dev/test environments used only during business hours</td>
            <td style={{ padding: '0.75rem' }}><strong>On-demand</strong>, torn down nightly</td>
            <td style={{ padding: '0.75rem' }}>Paying nothing outside working hours beats any discount on an instance you don&apos;t need running at all</td>
          </tr>
        </tbody>
      </table>

      <h2>Right-Sizing: Match Capacity to Real Load</h2>

      <p>
        The default failure mode is provisioning &quot;just in case&quot;: someone picks a generous instance
        size or server count based on a guess, ships it, and nobody revisits the decision again until a cost
        review years later reveals the fleet has been running at single-digit-percent average CPU
        utilization the entire time. Nothing was ever visibly wrong — the service never went down — which is
        exactly why nobody looked. Over-provisioning fails silently. It doesn&apos;t cause incidents, it just
        quietly costs money, month after month, forever.
      </p>

      <p>
        The discipline that replaces the guess is measurement: pull real CPU, memory, and network
        utilization from monitoring over a representative period, and size instance type and count to
        comfortably cover the <em>actual</em> peak — the ~1,389 req/s from the worked example above, not a
        round number someone picked in a planning meeting years ago. Headroom still belongs in the
        calculation (that&apos;s what Step 5 was), but headroom stacked on top of a measured peak is a very
        different, defensible number than a guess padded &quot;to be safe.&quot;
      </p>

      <InfoBox variant="warning" title="The Instance Size That Outlived Its Reason">
        <p>
          A common variant of the same trap: a service is sized correctly at launch, then traffic patterns
          shift — a feature gets deprecated, a client migrates away, a cache gets added upstream — and
          utilization drops, but the instance count never does, because resizing a running fleet feels
          riskier than leaving it alone. Right-sizing isn&apos;t a decision made once at launch; it&apos;s a
          number that needs re-checking against current, measured load on a recurring basis, not just the
          first time.
        </p>
      </InfoBox>

      <p>
        Autoscaling is what makes aggressive right-sizing safe rather than reckless: instead of provisioning
        for peak load 24 hours a day, you provision closer to typical load and let the platform add
        instances as real-time metrics rise toward peak, then remove them as load falls back off.
        Right-sizing sets a sane baseline; autoscaling is the mechanism that covers the gap between baseline
        and peak without paying for peak capacity around the clock.
      </p>

      <h2>The Costs Compute-Focused Planning Misses</h2>

      <p>
        Everything above has been about compute — instances and which pricing model buys them. Compute is
        usually the line item everyone models, and it is rarely the only line item that matters.
      </p>

      <h3>Data Transfer / Egress</h3>
      <p>
        Moving data <em>out</em> of a cloud provider&apos;s network — to the public internet, or to another
        cloud — and moving data <em>between</em> regions inside the same provider is commonly metered and
        billed per GB, while data moving <em>in</em> is typically cheap or free. That asymmetry is easy to
        miss when a cost estimate is built from compute alone. A multi-region architecture with services in
        different regions calling each other on every request, or a service that streams large files
        (video, backups, model weights) directly to users, can accumulate transfer costs that rival or
        exceed the compute bill — and that is exactly the kind of cost a capacity plan focused only on
        &quot;how many servers&quot; will miss entirely.
      </p>

      <h3>Storage Class Tiering</h3>
      <p>
        Cloud storage isn&apos;t priced uniformly — &quot;hot&quot; storage for data read and written
        frequently costs noticeably more per GB than &quot;cold&quot; or archival tiers meant for data
        rarely touched, and cold tiers usually add a retrieval fee and a delay in exchange for the lower
        storage rate. Leaving everything in the default hot tier forever — years of logs, old backups, data
        nobody has queried in months — is a quiet, compounding leak. The fix is a lifecycle policy that
        automatically moves data to a cheaper tier once it crosses an age threshold you define, rather than
        relying on a person to remember to do it.
      </p>

      <h3>Idle and Orphaned Resources</h3>
      <p>
        This is, in practice, one of the most common real-world cost leaks, precisely because nothing about
        it looks broken: a storage volume left behind after the instance it was attached to was terminated,
        a load balancer nobody removed after the service it fronted was decommissioned, a snapshot schedule
        nobody&apos;s cleanup job ever covered, a &quot;temporary&quot; test environment still running months
        after the project it supported shipped. None of it triggers an alert or causes an incident. It shows
        up only as a bill that&apos;s higher than the architecture diagram explains, and the only real
        defense is periodically auditing what&apos;s actually running against what&apos;s actually in use.
      </p>

      <InfoBox variant="tip" title="Capacity Planning Is a Trade-off, Not a Minimization Problem">
        <p>
          It&apos;s tempting to treat all of this as an optimization problem where the answer is &quot;spend
          as little as possible.&quot; It isn&apos;t. Cost is one of the standard quality attributes covered
          in the Well-Architected Framework lesson elsewhere in this section, alongside availability and
          performance — and like every quality attribute, it trades off against the others. The right
          capacity plan is never just the cheapest one; it&apos;s the cheapest one that still meets the
          availability and performance targets the service actually committed to, which is exactly what the
          Non-Functional Requirements lesson elsewhere in this site is about pinning down in the first place.
          A plan that trims 20% off compute by deleting the failover headroom from Step 5 isn&apos;t a cost
          win — it&apos;s a quietly broken SLA.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"Your team runs a fleet of stateless workers that process an overnight batch job — if a worker is interrupted mid-job, it resumes cleanly from the last checkpoint on a new instance. Your primary Postgres database runs as a single always-on instance with no standby configured yet. Which pricing model should each use?"}
        options={[
          "Spot for both — it's the cheapest option and neither is user-facing during the batch window",
          "Reserved (or on-demand) for the database, spot for the batch workers — the database can't tolerate its only instance being reclaimed, while the batch workers are built to absorb exactly that",
          "On-demand for the database and reserved for the batch workers, because reserved instances can't be interrupted",
          "Spot for the database because it's cheaper, and reserved for the batch workers because they run at a predictable time every night"
        ]}
        correctIndex={1}
        explanation={"The batch workers are the textbook spot use case: interruption costs a delay (resume from checkpoint), not an outage, so it's safe to take the deepest discount and accept reclaim risk. The database is the opposite profile — a single instance with no standby means losing it, even briefly and even with warning, is a full outage. That workload needs the provider's uptime guarantee (on-demand, or reserved once the load is predictable enough to commit to), never spot's 'we might take this back' guarantee."}
      />
    </LessonLayout>
  );
}
