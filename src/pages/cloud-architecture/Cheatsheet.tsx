import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CloudArchitectureCheatsheet() {
  return (
    <LessonLayout
      title="📋 Cheat Sheet"
      sectionId="cloud-architecture"
      lessonIndex={5}
      prev={{ path: '/cloud-architecture/cicd', label: 'CI/CD Pipelines & Deployment Strategies' }}
      next={null}
    >
      <p>
        A single-page reconciliation of every framework and figure used across this section.
        Every claim below was checked against live official documentation somewhere in the four
        lessons that precede this one — no Terraform or cloud CLI is installed in this
        environment, so anything requiring real execution is labeled accordingly.
      </p>

      <h2>Well-Architected Frameworks — Verified Against Live Docs</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Provider</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Pillar count</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Has Sustainability?</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>AWS</strong></td>
            <td style={{ padding: '0.75rem' }}>6 (added Dec 2, 2021)</td>
            <td style={{ padding: '0.75rem', color: 'var(--accent-green)' }}>Yes</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Azure</strong></td>
            <td style={{ padding: '0.75rem' }}>5</td>
            <td style={{ padding: '0.75rem', color: 'var(--accent-red)' }}>No — genuinely absent</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Google Cloud</strong></td>
            <td style={{ padding: '0.75rem' }}>6</td>
            <td style={{ padding: '0.75rem', color: 'var(--accent-green)' }}>Yes</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Vendor-Authored, Not Neutral">
        <p>
          These frameworks are checklists a vendor curated for auditing workloads against their
          own services — useful structure, not an academic standard. AWS's own review tool
          literally surfaces real questions like <em>&quot;How do you back up data?&quot;</em>{' '}
          (verified verbatim from AWS's own Well-Architected Tool question pages, not
          paraphrased). A &quot;zero High Risk Issues&quot; result means alignment with one
          vendor's opinions, not objective proof of good architecture.
        </p>
      </InfoBox>

      <h2>Infrastructure as Code</h2>

      <CodeBlock language="text" title="Terraform core concepts — verified against developer.hashicorp.com">
{`plan  shows a diff, changes NOTHING          <- the actual safety mechanism
apply executes the diff (prompts by default)

State file: dangerous — can contain secrets in plaintext, and losing
it desyncs Terraform's understanding of reality from actual infra.
Remote state + locking exists specifically to stop two people
applying conflicting changes simultaneously.

Current (verified live): S3 backend locking now uses "use_lockfile"
natively — the older dynamodb_table-based locking is DEPRECATED.
This changed; don't trust an older tutorial's locking setup blindly.

All example HCL in this section is syntactically verified against
real provider docs but NOT executed — no terraform CLI or cloud
credentials exist in this environment. Run "terraform plan" yourself
before trusting any example, here or elsewhere.`}
      </CodeBlock>

      <h2>Multi-Region & Disaster Recovery</h2>

      <CodeBlock language="text" title="RTO vs RPO — the single most common confusion in this area">
{`RTO (Recovery Time Objective)   how long can it be DOWN     -> a clock
RPO (Recovery Point Objective)  how much data can you LOSE  -> a distance
                                                                back in time

A system can have great RTO and terrible RPO simultaneously —
restored in 2 minutes, but rolled back to a 6-hour-old backup.
They are driven by DIFFERENT mechanisms: RPO by replication
continuity, RTO by how automated the failover process is.`}
      </CodeBlock>

      <CodeBlock language="text" title="The 4 DR strategies, increasing cost/complexity (verified AWS terminology)">
{`Backup & Restore        cheapest    worst RTO/RPO
Pilot Light              minimal always-on core, scaled up on failover
Warm Standby             scaled-down but FULLY functional, always running
Multi-Site Active/Active most expensive   best RTO/RPO, full traffic
                          in multiple regions simultaneously

Most systems do NOT need active-active. The cost/complexity is only
justified by a genuine business requirement (regulatory, or true
24/7 global-scale need) — this is commonly over-engineered.

The hard problem active-active introduces: data replication
consistency. This is exactly where CAP theorem (Distributed Systems
lesson) stops being theoretical.`}
      </CodeBlock>

      <h2>Cost & Capacity Planning</h2>

      <CodeBlock language="text" title="The method, not the number — worked example">
{`2,000,000 DAU x 20 req/user/day = 40,000,000 requests/day
40,000,000 / 86,400s               ~= 463 req/s average
463 x 3 (peak multiplier)          ~= 1,389 req/s peak
1,389 / 200 req/s-per-instance     ~= 7 instances (assumption: load-test this)
7 x 1.3 headroom                    = ~10 instances provisioned

Reserved/committed-use: order-of-magnitude discount for a 1-3yr
commitment — don't budget off an exact percentage, it varies by
provider/term/region and changes over time.
Spot/preemptible: steepest discount, but reclaimable with short
notice (order of minutes) — fault-tolerant/interruptible workloads
ONLY (batch jobs), never a stateful primary database.

Commonly missed costs beyond compute: data egress/transfer, storage
tiering (hot vs. cold), and idle/orphaned resources (unattached
volumes, unused load balancers) — a genuine, common leak.`}
      </CodeBlock>

      <InfoBox variant="info" title="Section Index">
        <p>
          1. The Well-Architected Framework &nbsp;·&nbsp; 2. Infrastructure as Code — Terraform
          Fundamentals &nbsp;·&nbsp; 3. Multi-Region Architecture &amp; Disaster Recovery &nbsp;·&nbsp;
          4. Cost &amp; Capacity Planning &nbsp;·&nbsp; 5. This page
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
