import LessonLayout from '../../components/LessonLayout';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CloudArchitectureWellArchitected() {
  return (
    <LessonLayout
      title="The Well-Architected Framework"
      sectionId="cloud-architecture"
      lessonIndex={0}
      prev={null}
      next={{ path: '/cloud-architecture/iac', label: 'Infrastructure as Code — Terraform Fundamentals' }}
    >
      <p>
        &quot;Well-architected&quot; gets used as a vague compliment — a system someone likes the look
        of — as though it were a matter of taste. At AWS, Microsoft Azure, and Google Cloud it is not a
        matter of taste, it is a defined term. Each vendor publishes a named framework that breaks
        &quot;good architecture&quot; down into a fixed, small set of concerns called <strong>pillars</strong>,
        and then publishes a structured list of review questions you answer against each one. This lesson
        covers what the pillars actually are — per vendor, since the three lists are not identical — what
        the review process is for in practice, and where the framework&apos;s built-in bias toward its own
        vendor&apos;s services should make you treat it as a checklist rather than neutral doctrine.
      </p>

      <h2>AWS&apos;s Six Pillars</h2>

      <p>
        AWS published the first version of this framework in 2012, originally with five pillars.
        Sustainability was added as a sixth on December 2, 2021 — worth knowing not as trivia but as a
        reminder that these lists are not fixed; a framework you memorized a few years ago may already be
        out of date. As AWS currently defines it, the framework rests on these six:
      </p>

      <InfoBox variant="info" title="The Six AWS Pillars">
        <p><strong>Operational Excellence</strong> — the ability to support and run workloads effectively, gain insight into their operation, and continuously improve the processes and procedures behind them.</p>
        <p><strong>Security</strong> — protecting data, systems, and assets by taking advantage of cloud technologies to improve your overall security posture.</p>
        <p><strong>Reliability</strong> — a workload&apos;s ability to perform its intended function correctly and consistently, including the ability to operate and test it through its full lifecycle.</p>
        <p><strong>Performance Efficiency</strong> — using computing resources efficiently to meet requirements, and keeping that efficiency as demand shifts and technology evolves.</p>
        <p><strong>Cost Optimization</strong> — running systems that deliver business value at the lowest price point.</p>
        <p><strong>Sustainability</strong> — continually reducing the energy and resource footprint of a workload, added as the sixth pillar in December 2021.</p>
      </InfoBox>

      <p>
        AWS is explicit that these six are not independent scorecards you each try to max out — you trade
        them against one another based on business context. A development environment might reasonably
        sacrifice reliability for lower cost; a mission-critical workload might reasonably accept higher
        cost for higher reliability. AWS&apos;s own guidance singles out two pillars as the exception to
        that trade-off logic: Security and Operational Excellence are generally not the ones you sacrifice
        to improve the others.
      </p>

      <h2>The Same Idea, Three Vendors</h2>

      <p>
        AWS&apos;s framing has effectively become the industry&apos;s shared vocabulary for this idea.
        Azure publishes its own Well-Architected Framework, and Google Cloud publishes what it currently
        calls the Google Cloud Well-Architected Framework — the same body of guidance was previously
        branded the &quot;Architecture Framework&quot; before Google aligned the name with the rest of the
        industry. All three do the same thing: name a small set of pillars, then publish a structured
        review against them. None of the three pillar lists match exactly.
      </p>

      <p>
        Azure&apos;s Well-Architected Framework currently defines <strong>five</strong> pillars —
        Reliability, Security, Cost Optimization, Operational Excellence, and Performance Efficiency.
        There is no separate Sustainability pillar in Azure&apos;s current framework. Google Cloud&apos;s
        Well-Architected Framework currently defines <strong>six</strong> — Operational Excellence,
        Security, Privacy, and Compliance, Reliability, Cost Optimization, Performance Optimization, and
        Sustainability.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Underlying concern</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>AWS</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Azure</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Google Cloud</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Running &amp; continuously improving operations</td>
            <td style={{ padding: '0.75rem' }}><strong>Operational Excellence</strong></td>
            <td style={{ padding: '0.75rem' }}><strong>Operational Excellence</strong></td>
            <td style={{ padding: '0.75rem' }}><strong>Operational Excellence</strong></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Protecting data, systems &amp; assets</td>
            <td style={{ padding: '0.75rem' }}><strong>Security</strong></td>
            <td style={{ padding: '0.75rem' }}><strong>Security</strong></td>
            <td style={{ padding: '0.75rem' }}><strong>Security, Privacy, and Compliance</strong></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Correct, consistent function &amp; recovery</td>
            <td style={{ padding: '0.75rem' }}><strong>Reliability</strong></td>
            <td style={{ padding: '0.75rem' }}><strong>Reliability</strong></td>
            <td style={{ padding: '0.75rem' }}><strong>Reliability</strong></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Efficient use of resources under changing demand</td>
            <td style={{ padding: '0.75rem' }}><strong>Performance Efficiency</strong></td>
            <td style={{ padding: '0.75rem' }}><strong>Performance Efficiency</strong></td>
            <td style={{ padding: '0.75rem' }}><strong>Performance Optimization</strong></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Delivering value at the lowest sustainable price</td>
            <td style={{ padding: '0.75rem' }}><strong>Cost Optimization</strong></td>
            <td style={{ padding: '0.75rem' }}><strong>Cost Optimization</strong></td>
            <td style={{ padding: '0.75rem' }}><strong>Cost Optimization</strong></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Environmental / resource footprint</td>
            <td style={{ padding: '0.75rem' }}><strong>Sustainability</strong></td>
            <td style={{ padding: '0.75rem' }}>— no dedicated pillar</td>
            <td style={{ padding: '0.75rem' }}><strong>Sustainability</strong></td>
          </tr>
        </tbody>
      </table>

      <p>
        Read that table as directional, not as a spec. Four rows line up cleanly — reliability,
        performance, and cost mean close to the same thing at all three vendors, and the pillar names
        barely differ. The security row is where the packaging diverges more than the substance: Google
        Cloud folds privacy and regulatory compliance directly into the pillar&apos;s name, while AWS and
        Azure treat privacy and compliance as topics covered inside their Security pillar rather than named
        in the title — the underlying concerns overlap heavily, the labeling does not. Sustainability is
        the row where the frameworks genuinely disagree rather than just relabel: AWS and Google Cloud both
        promote it to a full pillar, Azure currently does not give it a dedicated pillar of its own.
      </p>

      <h2>What the Review Is Actually For</h2>

      <p>
        The pillars are the vocabulary; the review is the mechanism, and it is the part worth taking
        seriously. AWS operationalizes its pillar list into a free console service it literally calls the{' '}
        <strong>AWS Well-Architected Tool</strong>, which walks you through a fixed, published set of
        questions — organized one set per pillar — against a workload you already run or are about to
        design. The point is not to pass a quiz; it is that an unaddressed best practice becomes a flagged,
        prioritized risk against the workload instead of a gap nobody wrote down.
      </p>

      <InfoBox variant="note" title="Real AWS Review Questions (Quoted, Not Paraphrased)">
        <p><strong>SEC 2</strong> (Security) — &quot;How do you manage authentication for people and machines?&quot;</p>
        <p><strong>REL 9</strong> (Reliability) — &quot;How do you back up data?&quot;</p>
        <p><strong>OPS 8</strong> (Operational Excellence) — &quot;How do you understand the health of your workload?&quot;</p>
      </InfoBox>

      <p>
        Each question expands into a checklist of specific best practices. Skip a foundational one and the
        tool flags it a <strong>High Risk Issue</strong>; skip a less critical one and it is a{' '}
        <strong>Medium Risk Issue</strong>. The resulting dashboard is a prioritized backlog, not a
        pass/fail grade. That is the actual value of the framework in practice — it turns &quot;is this
        architecture any good?&quot;, an unanswerable question as stated, into a fixed, repeatable list of
        narrower questions you can answer on a cadence, ideally before a gap becomes an incident rather than
        during the retro after one.
      </p>

      <p>
        If this pillar-and-trade-off structure feels familiar, it should:{' '}
        <strong>
          the Well-Architected pillars are a vendor-curated, cloud-specific operationalization of the same
          generic quality-attribute trade-off framework covered in the Quality Attributes lesson
        </strong>
        . Both start from the same premise — &quot;good architecture&quot; is not one property but a bundle
        of competing -ilities you deliberately trade against each other for a specific workload&apos;s
        actual constraints, not a checklist you max out uniformly across the board.
      </p>

      <InfoBox variant="warning" title="These Frameworks Are Not Neutral">
        <p>
          Every one of these frameworks is authored by the vendor selling the fix for whatever it flags.
          AWS&apos;s reliability guidance leans on AWS Backup and Multi-AZ RDS; Azure&apos;s leans on
          Availability Zones and Azure Site Recovery; Google Cloud&apos;s leans on regional persistent disks
          and Spanner. That is not a conspiracy — each vendor is understandably writing &quot;how to be
          reliable&quot; guidance that points at its own product catalog — but it means a clean
          Well-Architected score tells you a workload aligns well with one vendor&apos;s opinions and one
          vendor&apos;s tooling, not that it is objectively, vendor-independently well-engineered. Treat the
          pillar list as a useful, structured checklist for organizing a review, not as neutral academic
          doctrine. For a multi-cloud or on-prem architecture, translate the underlying concept — have we
          deliberately addressed reliability, security, cost, performance, operations, and sustainability,
          and can we defend the trade-offs we made — rather than following any single vendor&apos;s numbered
          pillar list as if it were the only correct taxonomy.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"A team runs the AWS Well-Architected Tool against their workload and gets zero High Risk Issues across all six pillars. A teammate concludes: \"Great, this architecture is objectively well-designed — we're done.\" What is the strongest critique of that conclusion?"}
        options={[
          "There's no valid critique — zero HRIs is AWS's official sign-off that an architecture is well-designed, full stop",
          "The review's questions and best practices are authored by AWS around AWS's own services, so a clean result confirms alignment with AWS's opinions and tooling, not an independent, vendor-neutral judgment of quality — Azure's or Google Cloud's own review could reasonably surface different gaps",
          "The Well-Architected Tool only evaluates the Cost Optimization pillar, so a result covering \"all six pillars\" isn't actually possible",
          "High Risk Issues only get assigned within the Security pillar, so the other five pillars can never produce a risk finding at all"
        ]}
        correctIndex={1}
        explanation={"The pillars and their review questions are written by the vendor whose services the resulting recommendations point back to. Passing a review with zero HRIs is a genuinely useful signal — it means the workload has no unaddressed gap that vendor considers foundational — but it's a vendor-framed signal, not a neutral verdict, and it says nothing about how the workload would score against a different provider's framework or against constraints that provider's tooling doesn't address. Options C and D are also factually wrong: the tool covers every pillar, and both High and Medium Risk Issues are assigned within each one, not just Security."}
      />
    </LessonLayout>
  );
}
