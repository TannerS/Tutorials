import LessonLayout from '../../components/LessonLayout';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CloudArchitectureMultiRegion() {
  return (
    <LessonLayout
      title="Multi-Region Architecture & Disaster Recovery"
      sectionId="cloud-architecture"
      lessonIndex={2}
      prev={{ path: '/cloud-architecture/iac', label: 'Infrastructure as Code — Terraform Fundamentals' }}
      next={{ path: '/cloud-architecture/capacity-planning', label: 'Cost & Capacity Planning' }}
    >
      <p>
        &quot;How many regions should this run in?&quot; is a question people reach for an intuition-based
        answer to — &quot;more is safer&quot; — when it actually has a precise, defensible answer derived
        from two numbers. Every disaster recovery architecture, from the cheapest to the most expensive,
        exists to hit a target for exactly two things: how long you can be down, and how much data you can
        afford to lose. Get those two numbers right first, and the DR strategy that satisfies them mostly
        picks itself.
      </p>

      <h2>RTO and RPO — The Two Numbers That Drive Everything</h2>

      <p>
        <strong>Recovery Time Objective (RTO)</strong> is the maximum acceptable delay between an
        application going down and service being restored — the answer to &quot;how long can we be
        down?&quot; <strong>Recovery Point Objective (RPO)</strong> is the maximum acceptable gap between
        the data available after recovery and the data that existed the instant before the disaster — the
        answer to &quot;how much data can we afford to lose?&quot; This phrasing tracks AWS&#39;s own
        disaster-recovery guidance closely on purpose: RTO is a statement about <strong>time to
        restore</strong>, RPO is a statement about <strong>data you&#39;re willing to lose</strong>, and
        conflating them is the single most common mistake in this area. A system can have an excellent RTO
        and a terrible RPO at the same time — restored in two minutes, but rolled back to a backup from six
        hours ago — and that is a completely coherent, if unusual, design target.
      </p>

      <InfoBox variant="info" title="RTO vs RPO in One Line Each">
        <p><strong>RTO</strong> — a clock that starts at the moment of failure and stops when service is back. Downtime.</p>
        <p><strong>RPO</strong> — a distance measured backward in time from the failure to your last durable copy of the data. Data loss.</p>
      </InfoBox>

      <h3>Worked Example: RTO of 1 Hour, RPO of 5 Minutes</h3>

      <p>
        Take those two targets literally and separately, because each one constrains a different part of
        the architecture:
      </p>

      <p>
        <strong>RPO of 5 minutes</strong> constrains data durability and replication, independent of
        anything else. It means that whatever mechanism captures your data, it cannot be a nightly backup
        job, or even an hourly one — a disaster at 2:59 into that hour would lose 59 minutes of writes.
        You need something replicating or checkpointing at an interval meaningfully under 5 minutes:
        continuous cross-region replication (a read replica streaming asynchronously, an object store&#39;s
        cross-region replication), or frequent automated snapshots on that cadence. This requirement exists
        whether or not anyone ever fails over — it&#39;s a standing property of how data is written.
      </p>

      <p>
        <strong>RTO of 1 hour</strong> constrains the failover process itself. A human being paged, waking
        up, reading a runbook for the first time, and manually clicking through a console to restore
        infrastructure realistically blows past an hour before they&#39;ve even finished diagnosing what
        broke. Hitting a 1-hour RTO in practice requires the recovery steps to already be automated and
        rehearsed — infrastructure that can be stood up (or is already standing by) without ad hoc
        decisions, and a failover procedure that&#39;s been run before, not one being improvised during
        the incident. Note what this number does <em>not</em> require: it does not by itself demand a
        second region taking live traffic right now. An hour is enough time for a well-automated
        pilot-light or warm-standby failover — it is the RPO of 5 minutes, not the RTO of 1 hour, that
        rules out &quot;restore from last night&#39;s backup.&quot;
      </p>

      <p>
        Put together, this specific pair of targets says: keep data replicating continuously (RPO drives
        that), and keep a failover path that&#39;s automated enough to execute in under an hour (RTO drives
        that) — which, as the next section covers, points at pilot light or warm standby, not necessarily
        the most expensive option available.
      </p>

      <h2>The DR Spectrum — Four Strategies, Increasing Cost and Complexity</h2>

      <p>
        AWS&#39;s disaster recovery guidance groups DR approaches into four standard tiers, and this
        terminology is worth learning precisely because it&#39;s the shared vocabulary used across cloud
        providers and in interviews, not something specific to one vendor&#39;s marketing:
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0', minWidth: '640px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Strategy</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>What&#39;s Running in the DR Region</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Typical RTO</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Typical RPO</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Relative Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '0.75rem' }}><strong>Backup &amp; Restore</strong></td>
              <td style={{ padding: '0.75rem' }}>Nothing — periodic backups only, infrastructure redeployed from scratch on failure</td>
              <td style={{ padding: '0.75rem' }}>Hours, often up to a day</td>
              <td style={{ padding: '0.75rem' }}>Hours (bounded by backup frequency)</td>
              <td style={{ padding: '0.75rem' }}>Lowest</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '0.75rem' }}><strong>Pilot Light</strong></td>
              <td style={{ padding: '0.75rem' }}>Core infra always on (databases replicating), app servers provisioned but switched off</td>
              <td style={{ padding: '0.75rem' }}>Tens of minutes to a few hours</td>
              <td style={{ padding: '0.75rem' }}>Minutes (continuous data replication)</td>
              <td style={{ padding: '0.75rem' }}>Low–Medium</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '0.75rem' }}><strong>Warm Standby</strong></td>
              <td style={{ padding: '0.75rem' }}>A scaled-down but fully functional copy of the whole stack, running continuously</td>
              <td style={{ padding: '0.75rem' }}>Minutes</td>
              <td style={{ padding: '0.75rem' }}>Seconds to low minutes</td>
              <td style={{ padding: '0.75rem' }}>Medium–High</td>
            </tr>
            <tr>
              <td style={{ padding: '0.75rem' }}><strong>Multi-Site Active-Active</strong></td>
              <td style={{ padding: '0.75rem' }}>Full production capacity, serving live traffic in every region simultaneously</td>
              <td style={{ padding: '0.75rem' }}>Near-zero (seconds)</td>
              <td style={{ padding: '0.75rem' }}>Near-zero, except for data-corruption events</td>
              <td style={{ padding: '0.75rem' }}>Highest</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        The progression is monotonic in both directions: each step buys a better (lower) RTO and RPO, and
        costs more to run and operate. <strong>Backup &amp; Restore</strong> keeps only backups, and
        rebuilds everything else from infrastructure-as-code at failover time. <strong>Pilot Light</strong>{' '}
        keeps the &quot;always-on core&quot; — typically the data layer, continuously replicating — while
        the compute layer sits provisioned-but-off until switched on and scaled out during a real failover.{' '}
        <strong>Warm Standby</strong> goes further: a real, running, request-serving copy of the stack at
        reduced capacity, so failover is a scale-up operation on infrastructure that&#39;s already live,
        not a cold start. <strong>Multi-Site Active-Active</strong> (AWS&#39;s own term for it; you will
        also hear &quot;multi-region active-active&quot; used interchangeably) runs full production traffic
        in more than one region at once, so there is, in a meaningful sense, no failover step for a full
        regional loss — the surviving region or regions were already serving live traffic before, during,
        and after. It is worth knowing there is a related but distinct pattern AWS calls{' '}
        <strong>hot standby</strong>: infrastructure identical in scale to warm standby&#39;s but sitting
        fully idle rather than active/active, used only if you specifically don&#39;t want a second region
        handling real user traffic under normal conditions.
      </p>

      <h2>The Hard Problem Active-Active Introduces: Data Replication Consistency</h2>

      <p>
        Everything up to warm standby has one region accepting writes at a time — the DR region is a
        target for replicated data, not a second source of truth. Multi-site active-active removes that
        simplification: if two regions both accept writes, you now need an answer for what happens when a
        user in Virginia and a user in Frankfurt update the <em>same record</em> within the same
        replication window. There is no configuration flag that makes this problem disappear — only
        different trade-offs for handling it, and AWS&#39;s own guidance names three common ones:{' '}
        <strong>write global</strong> (route all writes to one designated region, so there&#39;s never a
        conflict, at the cost of every other region taking a latency and availability hit on writes),{' '}
        <strong>write local</strong> (accept writes in whichever region is closest to the user, then
        reconcile — Amazon DynamoDB global tables, for instance, resolve concurrent conflicting writes with
        last-writer-wins, which is simple and fast and also means one of the two writers&#39; data silently
        loses), and <strong>write partitioned</strong> (assign each entity, like a user account, a single
        home region by some partition key, so writes for that entity never actually contend across
        regions).
      </p>

      <p>
        This is exactly the CAP theorem showing up outside a whiteboard. This site&#39;s systemdesign
        section already covers CAP theorem and the spectrum of consistency models — strong, eventual, and
        the space between — in real depth, and multi-region active-active is precisely the architecture
        where those trade-offs stop being theoretical and start being a genuine argument about whether two
        users on opposite sides of the planet are allowed to briefly see different values for the same
        piece of data. Choosing active-active without an explicit, deliberate answer to that question isn&#39;t
        avoiding the trade-off — it&#39;s making it by accident, usually in the direction of &quot;last
        writer wins&quot; whether or not anyone meant to pick that.
      </p>

      <InfoBox variant="warning" title="Most Systems Should Not Be Active-Active">
        <p>
          It is easy to read a table like the one above and conclude that near-zero RTO/RPO is simply
          &quot;the good one.&quot; In practice, multi-site active-active is commonly over-engineered —
          reached for because it sounds like the mature, senior-engineer answer, not because a real
          requirement demands it. The cost is not only infrastructure spend: it&#39;s the write-conflict
          problem above, doubled operational surface area, and failure modes (split-brain, silent data
          divergence) that simpler strategies never have to think about. It is justified when a genuine
          business requirement demands it — a regulatory mandate for data residency and failover in
          specific jurisdictions, or a true 24/7 global-scale availability requirement where even a
          few-minute warm-standby failover is unacceptable to the business. Absent one of those, warm
          standby or pilot light — cheaper, simpler, and still perfectly capable of hitting an aggressive
          RTO/RPO — is very often the correct answer, and saying so plainly in a design review is a stronger
          architectural instinct than defaulting to the most expensive tier on the chart.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"A system has an RPO of 15 minutes and an RTO of 4 hours. During an incident, the last successful data replication to the DR region completed 10 minutes before the primary region went down, and the team fully restores service 3 hours after the outage began. Did the system meet its targets?"}
        options={[
          "No — both targets were missed",
          "Yes to RPO (10 minutes of data loss is within the 15-minute target) and yes to RTO (3 hours of downtime is within the 4-hour target)",
          "Yes to RTO, but RPO doesn't apply here since no backup was actually restored",
          "The scenario is contradictory — RTO and RPO can't both be satisfied in the same incident"
        ]}
        correctIndex={1}
        explanation={"RPO measures data loss, independent of how long recovery took: 10 minutes of lost writes is within the 15-minute RPO target. RTO measures downtime, independent of how much data was lost: 3 hours of downtime is within the 4-hour RTO target. They are two separate measurements of two separate failures (data loss vs. unavailability), and a single incident is scored against each one on its own — there's nothing contradictory about meeting both, missing both, or meeting only one."}
      />
    </LessonLayout>
  );
}
