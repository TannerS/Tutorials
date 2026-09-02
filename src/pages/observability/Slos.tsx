import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function ObservabilitySlos() {
  return (
    <LessonLayout
      title="SLIs, SLOs & Error Budgets"
      sectionId="observability"
      lessonIndex={1}
      prev={{ path: '/observability/three-pillars', label: 'The Three Pillars: Metrics, Logs, Traces' }}
      next={{ path: '/observability/tracing', label: 'Distributed Tracing Design' }}
    >
      <p>
        &quot;Reliability&quot; is a vague goal until you attach a number to it, and even then, three
        different-sounding terms — SLI, SLO, SLA — get used interchangeably for what are three
        distinct things: a <em>measurement</em>, a <em>target</em>, and a <em>contract</em>. Mixing
        them up isn't just pedantry. It's the difference between an internal engineering target a team
        can quietly renegotiate next sprint, and a legal commitment to a paying customer with money
        attached to missing it. This framework — the SLI/SLO/SLA vocabulary plus the{' '}
        <strong>error budget</strong> mechanism that connects them to release decisions — is formalized
        in Google's <em>Site Reliability Engineering: How Google Runs Production Systems</em> (O'Reilly,
        2016; edited by Betsy Beyer, Chris Jones, Jennifer Petoff, and Niall Richard Murphy), freely
        readable online at <code>sre.google/sre-book</code>. Chapter 4, &quot;Service Level
        Objectives,&quot; defines the three terms; Chapter 3, &quot;Embracing Risk,&quot; works out the
        error-budget mechanics used below.
      </p>

      <h2>Three Words, Three Different Things</h2>

      <InfoBox variant="info" title="The Book's Definitions, Verbatim">
        <p>
          <strong>SLI (Service Level Indicator)</strong> — &quot;a carefully defined quantitative
          measure of some aspect of the level of service that is provided.&quot; A number you actually
          measure.
        </p>
        <p>
          <strong>SLO (Service Level Objective)</strong> — &quot;a target value or range of values for
          a service level that is measured by an SLI.&quot; The threshold you're aiming to keep that
          number above (or below).
        </p>
        <p>
          <strong>SLA (Service Level Agreement)</strong> — &quot;an explicit or implicit contract with
          your users that includes consequences of meeting (or missing) the SLOs they contain.&quot;
          An SLO with money, refunds, or legal exposure attached.
        </p>
      </InfoBox>

      <p>
        Notice the SLA definition doesn't just repeat the SLO — the defining feature is{' '}
        <strong>consequences</strong>. An SLO you miss internally means a Monday postmortem. An SLA you
        miss means a customer is contractually owed a service credit, or worse. Same underlying
        measurement, radically different stakes, which is exactly why teams pick SLO targets with a
        safety margin above whatever they've promised in an SLA — you don't want your internal
        engineering target and your contractual floor to be the same number.
      </p>

      <h2>One Measurement, Expressed Three Ways</h2>

      <p>
        Take a checkout API and watch the same underlying fact travel through all three roles:
      </p>

      <CodeBlock language="text" title="Checkout API — SLI, SLO, and SLA for the same measurement">
{`SLI  (the measurement itself, defined precisely):
     "The percentage of checkout requests that complete successfully
      (HTTP 2xx) within 200ms, measured over a rolling 30-day window."

SLO  (the internal target for that SLI):
     "99.9% of checkout requests will meet the SLI above, over any
      rolling 30-day window."
     -> This is what the on-call team is actually held to. Miss it,
        and the org's own error-budget policy kicks in (see below).

SLA  (the external, contractual version — usually looser than the SLO):
     "If fewer than 99.5% of checkout requests complete successfully
      within 500ms in a calendar month, the customer is entitled to
      a 10% service credit for that month's invoice."
     -> Deliberately looser than the 99.9%/200ms SLO. The gap between
        SLO and SLA is the team's margin for error before a miss
        costs the company money, not just an internal ding.`}
      </CodeBlock>

      <p>
        That gap between the SLO (99.9% / 200ms) and the SLA (99.5% / 500ms) is not sloppiness — it's
        deliberate. If the SLO and the SLA were identical, the team would have zero room to miss its
        own internal target without also triggering a contractual, financial consequence. A looser SLA
        gives engineering room to treat an SLO miss as a fire drill instead of a legal event.
      </p>

      <h2>Error Budget: Turning the SLO Into a Spendable Resource</h2>

      <p>
        An SLO of 99.9% implicitly admits something most teams are uncomfortable saying out loud:
        100% is not the target, and 0.1% of requests are <em>allowed</em> to fail or be slow — that's
        not a bug, it's the budget. The SRE book calls this the <strong>error budget</strong>: the
        inverse of the SLO, expressed as an actual quantity of allowed failure over a time window, that
        the team is free to &quot;spend&quot; on things that carry risk — deploys, migrations,
        experiments — without breaching the SLO.
      </p>

      <p>
        This isn't hand-waved in the book — it's arithmetic. If the SLO is 99.9% availability over a
        rolling 30-day window, the error budget is the leftover 0.1%, converted into minutes of
        allowed downtime:
      </p>

      <CodeBlock language="text" title="Error budget arithmetic — 99.9% SLO over 30 days">
{`Step 1 — total minutes in the window:
    30 days x 24 hours/day x 60 minutes/hour = 43,200 minutes

Step 2 — the allowed failure fraction is the gap between the SLO and 100%:
    100% - 99.9% = 0.1%  =  0.001

Step 3 — multiply the window by the allowed fraction:
    43,200 minutes x 0.001 = 43.2 minutes

Error budget for a 99.9% SLO, 30-day window: 43.2 minutes of downtime.
That's the entire budget for the month — deploy-caused outages, a bad
migration, a dependency blip, everything, all drawn from the same 43.2
minutes.`}
      </CodeBlock>

      <p>
        43.2 minutes sounds generous until you realize a single botched deploy that takes 20 minutes
        to roll back has just spent nearly half the month's entire budget. Now push the same target one
        &quot;nine&quot; further, to 99.99%, and watch what happens to the number:
      </p>

      <CodeBlock language="text" title="Error budget arithmetic — 99.99% SLO over 30 days">
{`Step 1 — total minutes in the window (same window):
    43,200 minutes

Step 2 — allowed failure fraction:
    100% - 99.99% = 0.01%  =  0.0001

Step 3 — multiply:
    43,200 minutes x 0.0001 = 4.32 minutes  (259.2 seconds)

Error budget for a 99.99% SLO, 30-day window: 4.32 minutes of downtime.

Going from 99.9% to 99.99% didn't shrink the budget by 10% — it shrunk
it to 1/10th: 43.2 minutes -> 4.32 minutes. Every additional nine divides
the allowed downtime by 10, which is exactly why each nine costs
disproportionately more engineering effort than the last: redundant
infrastructure, automated failover, zero-downtime deploys, and so on,
all to protect a budget measured in single-digit minutes per month.`}
      </CodeBlock>

      <InfoBox variant="tip" title="What the Budget Is Actually For">
        <p>
          The point of computing this number isn't the number itself — it's what the SRE book uses it
          to <em>decide</em>. Per Chapter 3 (&quot;Embracing Risk&quot;): as long as the budget isn't
          exhausted, &quot;releases can continue&quot; — the team is free to ship faster and take on
          risk, because they have budget to spend. Once the budget is used up, the documented practice
          is that &quot;releases are temporarily halted while additional resources are invested in
          system testing and development to make the system more resilient&quot; — a release freeze,
          with the team's attention redirected to reliability work until the budget recovers. The book
          also notes an incentive effect: as the budget gets close to zero, product engineers
          themselves start pushing for more testing or a slower release cadence, because they don't
          want to be the team that burns the last of it and stalls everyone's launches. That's the
          actual mechanism — it turns &quot;be more reliable&quot; from a vague mandate into a shared,
          numeric budget that both product velocity and operational stability draw from.
        </p>
      </InfoBox>

      <p>
        In this stack specifically, the SLI side of this — the raw counters and latency histograms an
        error budget is computed from — is what <strong>Spring Boot Observability</strong> covers
        concretely: Micrometer timers and the <code>http.server.requests</code> metric are the kind of
        instrumentation an SLI query runs against.
      </p>

      <h2>Same Framework, Sanity-Checking Both Directions</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>SLO target</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Allowed downtime / 30 days</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Roughly</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>99% (&quot;two nines&quot;)</td>
            <td style={{ padding: '0.75rem' }}>432 minutes</td>
            <td style={{ padding: '0.75rem' }}>7.2 hours</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>99.9% (&quot;three nines&quot;)</td>
            <td style={{ padding: '0.75rem' }}>43.2 minutes</td>
            <td style={{ padding: '0.75rem' }}>~43 minutes</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>99.99% (&quot;four nines&quot;)</td>
            <td style={{ padding: '0.75rem' }}>4.32 minutes</td>
            <td style={{ padding: '0.75rem' }}>~260 seconds</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>99.999% (&quot;five nines&quot;)</td>
            <td style={{ padding: '0.75rem' }}>0.432 minutes</td>
            <td style={{ padding: '0.75rem' }}>~26 seconds</td>
          </tr>
        </tbody>
      </table>

      <p>
        Each row is the previous row's minutes divided by 10, because each additional nine divides the
        allowed failure fraction by 10 — the arithmetic from the two worked examples above, just run
        four times. That's why teams don't reach for 99.999% by default: it's not a marginally harder
        version of 99.9%, it's an order of magnitude less room for error, for infrastructure that has
        to justify its cost.
      </p>

    </LessonLayout>
  );
}
