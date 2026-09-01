import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function CloudArchitectureCheatsheet() {
  return (
    <GuideLayout
      title="Cloud & Infrastructure"
      kicker="FIELD GUIDE"
      glyph="☁️"
      tagline="Well-Architected frameworks, Terraform/IaC, multi-region DR, capacity planning, and CI/CD pipelines — condensed from the five lessons that precede this page."
      meta={['AWS · Azure · GCP', 'no CLI executed here', '14 panels']}
      page="1 / 1"
      footer="Every claim here was checked against live official documentation in the lessons that precede this page. No Terraform or cloud CLI exists in this environment — run terraform plan yourself before trusting any example, here or elsewhere."
      prev={{ path: '/cloud-architecture/cicd', label: 'CI/CD Pipelines & Deployment Strategies' }}
      next={null}
    >
      <GuidePanel n={1} title="Well-Architected Frameworks" accent="blue" glyph="🏛️" span={2}>
        <GuideTable
          head={['Provider', 'Pillars', 'Sustainability?']}
          rows={[
            ['AWS', '6 (added Dec 2, 2021)', 'Yes'],
            ['Azure', '5', 'No — genuinely absent'],
            ['Google Cloud', '6', 'Yes'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={2} title="Vendor-Authored, Not Neutral" accent="purple" glyph="⚠️">
        <GuideRules
          items={[
            'A vendor-curated checklist for auditing workloads against THEIR OWN services — useful structure, not an academic standard.',
            'AWS\'s own Well-Architected Tool literally asks "How do you back up data?" — verified verbatim from AWS\'s own question pages, not paraphrased.',
            '"Zero High Risk Issues" means alignment with one vendor\'s opinions, not objective proof of good architecture.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={3} title="Terraform: Plan vs Apply" accent="green" glyph="🧭">
        <GuideCode>{`plan  shows a diff, changes NOTHING     <- the actual safety mechanism
apply executes the diff (prompts by default)`}</GuideCode>
        <GuideRules
          items={[
            'All HCL in this section is syntactically verified against real provider docs but NOT executed — no terraform CLI or cloud credentials exist in this environment.',
            'Run terraform plan yourself before trusting any example, here or elsewhere.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={4} title="State File Hazards" accent="amber" glyph="🗃️">
        <GuideRules
          items={[
            'The state file is dangerous — it can contain secrets in plaintext.',
            "Losing it desyncs Terraform's understanding of reality from actual infrastructure.",
            'Remote state + locking exists specifically to stop two people applying conflicting changes simultaneously.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={5} title="Backend Locking — Current vs Deprecated" accent="pink" glyph="🔒">
        <GuideDefs
          items={[
            ['use_lockfile', 'current (verified live) — S3 backend locking now uses this natively'],
            ['dynamodb_table locking', 'DEPRECATED — the older pattern many tutorials still show'],
          ]}
        />
        <GuideRules items={["This changed — don't trust an older tutorial's locking setup blindly."]} />
      </GuidePanel>

      <GuidePanel n={6} title="RTO vs RPO" accent="cyan" glyph="⏱️">
        <GuideDefs
          items={[
            ['RTO (Recovery Time Objective)', 'how long can it be DOWN — a clock'],
            ['RPO (Recovery Point Objective)', 'how much data can you LOSE — a distance back in time'],
          ]}
        />
        <GuideRules
          items={[
            'A system can have great RTO and terrible RPO simultaneously — restored in 2 minutes, but rolled back to a 6-hour-old backup.',
            'They are driven by DIFFERENT mechanisms: RPO by replication continuity, RTO by how automated the failover process is.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={7} title="The 4 DR Strategies" accent="red" glyph="🌐" span={2}>
        <GuideTable
          head={['Strategy', 'Description']}
          rows={[
            ['Backup & Restore', 'cheapest — worst RTO/RPO'],
            ['Pilot Light', 'minimal always-on core, scaled up on failover'],
            ['Warm Standby', 'scaled-down but FULLY functional, always running'],
            ['Multi-Site Active/Active', 'most expensive — best RTO/RPO, full traffic in multiple regions simultaneously'],
          ]}
        />
        <GuideRules items={['Listed in increasing cost/complexity order (verified AWS terminology).']} />
      </GuidePanel>

      <GuidePanel n={8} title="Active-Active: When It's Actually Justified" accent="blue" glyph="⚖️">
        <GuideRules
          items={[
            'Most systems do NOT need active-active — the cost/complexity is only justified by a genuine business requirement (regulatory, or a true 24/7 global-scale need).',
            'This is commonly over-engineered.',
            'The hard problem it introduces is data replication consistency — exactly where CAP theorem (Distributed Systems section) stops being theoretical.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={9} title="Capacity Planning — Worked Method" accent="purple" glyph="🧮" span={2}>
        <GuideCode>{`2,000,000 DAU x 20 req/user/day = 40,000,000 requests/day
40,000,000 / 86,400s               ~= 463 req/s average
463 x 3 (peak multiplier)          ~= 1,389 req/s peak
1,389 / 200 req/s-per-instance     ~= 7 instances (assumption: load-test this)
7 x 1.3 headroom                    = ~10 instances provisioned`}</GuideCode>
        <GuideRules
          items={[
            'This is the METHOD, not a number to memorize — the assumptions (req/instance, peak multiplier, headroom) are what you load-test and defend.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={10} title="Reserved vs Spot/Preemptible" accent="green" glyph="💸">
        <GuideDefs
          items={[
            ['Reserved / committed-use', "order-of-magnitude discount for a 1-3yr commitment — don't budget an exact percentage, it varies by provider/term/region and changes over time"],
            ['Spot / preemptible', 'steepest discount, but reclaimable with short notice (order of minutes) — fault-tolerant/interruptible workloads ONLY, never a stateful primary database'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={11} title="Costs People Forget" accent="amber" glyph="🕳️">
        <GuideRules
          items={[
            'Data egress/transfer.',
            'Storage tiering — hot vs. cold.',
            'Idle/orphaned resources — unattached volumes, unused load balancers. A genuine, common leak.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={12} title="CI vs Delivery vs Deployment" accent="blue" glyph="🚦" span={2}>
        <GuideDefs
          items={[
            ['Continuous Integration', 'every push auto-built + tested — says nothing about deployment at all'],
            ['Continuous Delivery', 'auto-built, tested, pushed as far as staging — a human still clicks to release to prod'],
            ['Continuous Deployment', 'every change that passes CI ships to prod automatically — no approval step, no exceptions'],
          ]}
        />
        <GuideRules
          items={[
            'The word that separates the last two is "automatic": Delivery makes every change deployABLE; Deployment makes every change deployED.',
            'One manual "click to release" button in prod means Delivery, full stop — no matter how automated everything before it is.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={13} title="Deployment Strategies at a Glance" accent="green" glyph="🚀" span={2}>
        <GuideTable
          head={['Strategy', 'Rollback', 'Blast Radius']}
          rows={[
            ['Blue-Green', 'Instant — flip router back to blue, which never stopped running', 'All traffic, the instant you cut over'],
            ['Canary', 'Fast — route the small canary slice back', 'Small and contained — only the canary % is exposed'],
            ['Rolling', 'Slower — roll the old version back out batch by batch', 'Partial but growing — old + new both serve traffic throughout'],
          ]}
        />
        <GuideRules items={['Rolling is the default K8s strategy precisely because it needs no duplicate environment at all.']} />
      </GuidePanel>

      <GuidePanel n={14} title="Feature Flags: Deploy ≠ Release" accent="pink" glyph="🚩">
        <GuideDefs
          items={[
            ['Deployment', 'code physically running on prod infrastructure'],
            ['Release', 'that code actually being visible/active for users'],
          ]}
        />
        <GuideRules
          items={[
            'A flag lets code ship dark (deployed, switched off) and get released later, independent of any redeploy.',
            'Turning a flag back off is instant — no rollback or redeploy required — which is what makes true Continuous Deployment tractable for risky features.',
          ]}
        />
      </GuidePanel>
    </GuideLayout>
  );
}
