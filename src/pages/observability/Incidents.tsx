import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function ObservabilityIncidents() {
  return (
    <LessonLayout
      title="Alerting & Incident Response"
      sectionId="observability"
      lessonIndex={3}
      prev={{ path: '/observability/tracing', label: 'Distributed Tracing Design' }}
      next={{ path: '/observability/cheatsheet', label: '📋 Cheat Sheet' }}
    >
      <p>
        Metrics, logs, and traces exist to answer a question the moment something goes wrong: what's
        broken, and where. Alerting is the layer that decides <em>when to interrupt a human</em> with
        that information, and incident response is what happens in the minutes and days after that
        interruption. Both have well-documented, widely adopted practices behind them — mostly codified
        by Google's Site Reliability Engineering (SRE) team and now standard vocabulary across the
        industry — and both are easy to get wrong in ways that either drown on-call engineers in noise or
        let real problems sit unnoticed.
      </p>

      <h2>Alert On Symptoms, Not Every Cause</h2>

      <p>
        Google's SRE book frames monitoring around two separate questions: <strong>what's broken</strong>{' '}
        — the symptom — and <strong>why</strong> — a possibly intermediate cause. A <strong>symptom</strong>{' '}
        is something a user actually experiences: elevated error rate, slow responses, a failed checkout.
        A <strong>cause</strong> is an internal condition that might be contributing to that: high CPU on
        one pod, a slow query plan, a GC pause, a retry storm on one downstream dependency. The SRE
        practice is to page on symptoms and treat causes as diagnostic detail you pull up{' '}
        <em>after</em> the page fires, not as a separate source of pages.
      </p>

      <p>
        The reasoning is about signal-to-noise, not purism. Causes are numerous — there are dozens of
        internal metrics that could theoretically precede a problem — and most of them self-correct or
        never actually reach the user: a GC pause on one of eight pods, a brief connection retry, a cache
        miss spike. Paging on every one of those trains on-call engineers to ignore pages, which is worse
        than not paging at all. A symptom-based alert only fires when someone outside the system would
        notice something is wrong.
      </p>

      <p>
        This connects directly to error budgets from the SLOs lesson: a well-designed alert doesn't fire
        on every internal blip, it fires when the <strong>error budget is burning faster than the rate
        that would exhaust it before the window resets</strong> — which is itself a symptom-based signal,
        derived from what users are actually experiencing, not from which internal component looks
        unusual right now.
      </p>

      <InfoBox variant="tip" title="Same Root Cause, Two Very Different Alerts">
        <p>
          <strong>Cause-based (avoid as a page):</strong> &quot;CPU on pod order-service-7 exceeded 85% for
          5 minutes.&quot; This might be nothing — the autoscaler may already be handling it, and no user
          has noticed anything.
        </p>
        <p>
          <strong>Symptom-based (page on this):</strong> &quot;5xx rate on <code>/checkout</code> exceeded
          2% for 5 minutes&quot; or &quot;error budget burn rate is 10x the sustainable rate.&quot; Both
          describe something a real user is experiencing right now, regardless of which internal
          component turns out to be responsible.
        </p>
      </InfoBox>

      <h2>The Incident Lifecycle</h2>

      <p>
        Once a symptom-based alert does fire, the response follows a standard shape used across the SRE
        and DevOps community — Google's own SRE workbook, PagerDuty, and Atlassian's incident-management
        guidance all describe some version of the same stages, even when the exact labels differ slightly
        between organizations:
      </p>

      <FlowChart
        title="Incident Lifecycle"
        chart={"graph LR\n  A[\"Detection\\nalert fires or\\nsomeone reports it\"] --> B[\"Triage\\nassess severity,\\nassign an owner\"]\n  B --> C[\"Mitigation\\nstop user impact\\n(often a workaround)\"]\n  C --> D[\"Resolution\\nfix the actual\\nroot cause\"]\n  D --> E[\"Postmortem\\nblameless review,\\nfind systemic fixes\"]\n  style C fill:#3d2f14,stroke:#d97706\n  style E fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        <strong>Detection</strong> is the alert firing, or a human noticing and reporting it.{' '}
        <strong>Triage</strong> assigns severity and an owner — how bad is this, who needs to be involved,
        does it need to wake more people up. <strong>Mitigation</strong> and <strong>resolution</strong>{' '}
        are deliberately two separate stages, and the distinction matters: Google's own SRE workbook is
        explicit that &quot;first responders must prioritize mitigation above all else&quot; — stopping
        user-facing impact, even with a rollback, a feature flag flip, or a manual failover — is a
        different and usually much faster job than fully understanding and fixing what actually caused
        the problem. A service can be mitigated in minutes and not properly resolved for days. Only after
        the incident is over does the <strong>postmortem</strong> happen — a written review of what
        happened and, more importantly, why the systems and processes allowed it to happen.
      </p>

      <p>
        Here is what that lifecycle looks like end to end for a plausible incident on a Java/Spring stack
        — a database connection pool quietly running out of connections under load:
      </p>

      <CodeBlock language="text" title="Incident Timeline — Connection Pool Exhaustion">
{`14:02:03  DETECTION
          PagerDuty alert fires: "checkout-service 5xx rate > 2% for 5m"
          (symptom-based — fired on user-facing error rate, not on any internal
          pool metric)

14:04:10  TRIAGE
          On-call engineer acks the page. Dashboards show p99 latency on
          /checkout climbing from 120ms to 9s over the last 8 minutes.
          Severity assigned: SEV-2 (partial outage, checkout flow only).
          Incident channel opened, second engineer paged in to help.

14:06:45  INVESTIGATION BEGINS
          Logs show: "HikariPool-1 - Connection is not available,
          request timed out after 30000ms". Trace view confirms every slow
          request is blocked in the same span: acquiring a DB connection,
          not executing a query. A marketing push notification went out at
          13:58, tripling traffic to /checkout.

14:11:20  MITIGATION
          Engineer manually bumps HikariCP maximum-pool-size via a config
          flag and restarts pods on a rolling basis. This is a workaround,
          not a fix: pool size was raised, not the reason it ran out.
          5xx rate drops back under 0.1% within 3 minutes.

14:14:52  MITIGATED — impact resolved
          Incident channel updated: user-facing impact over. Incident stays
          open at lower urgency for root-cause work.

16:30:00  RESOLUTION
          Root cause confirmed: a downstream inventory-service call inside
          the checkout transaction had no timeout, so under load it held DB
          connections open far longer than normal instead of failing fast.
          Fix merged: explicit timeout added to the downstream call, pool
          sized with headroom, and a burn-rate alert added on pool
          checkout-wait-time specifically.

Next day  POSTMORTEM
          Blameless write-up published: timeline, contributing factors
          (missing downstream timeout, no alert on pool saturation itself,
          marketing push not coordinated with on-call), and follow-up
          action items with owners — not a conclusion about who should
          have caught it sooner.`}
      </CodeBlock>

      <h2>Blameless Postmortems</h2>

      <p>
        A <strong>blameless postmortem</strong> is a documented incident review that focuses entirely on{' '}
        <strong>identifying the systemic contributing factors</strong> — a missing alert, an unclear
        runbook, a risky deploy process, a missing timeout — <strong>without indicting any individual or
        team for bad or inappropriate behavior</strong>. This is standard practice across the SRE
        community, documented directly in Google's SRE book, and it isn't a nicety — it's a specific,
        argued position: blame suppresses the honest reporting an organization needs in order to find and
        fix the weaknesses that let an incident happen in the first place. If engineers expect that
        admitting &quot;I didn't realize that call had no timeout&quot; or &quot;I pushed that config
        change&quot; will be used against them, the postmortem quietly stops collecting the details that
        would actually prevent a repeat. The operating assumption is that everyone involved had good
        intentions and acted on the information they had at the time — the postmortem's job is to work
        out why that information was incomplete or that process was unsafe, because, in the SRE book's own
        framing, you can't &quot;fix&quot; a person's judgment, but you can fix the system and process that
        put them in a position to make that call.
      </p>

      <InfoBox variant="warning" title="Runbooks: Written Before the Incident, Not During It">
        <p>
          A <strong>runbook</strong> is a documented, tested procedure for a specific, known failure mode
          — &quot;connection pool exhausted: check X, run Y, escalate if Z.&quot; The value of a runbook
          comes entirely from when it was written: calmly, in advance, by someone with time to verify each
          step actually works — not improvised at 2am by someone under pressure with a page open and a
          dashboard on fire. An untested runbook written during the incident it's supposed to cover isn't
          a runbook, it's a guess with good formatting. The postmortem above is exactly where a missing or
          outdated runbook gets caught and fixed for next time, before there is a next time.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"A Spring service's GC pauses spike to 4 seconds on one of eight pods for about 90 seconds, but request error rate and p99 latency both stay completely flat — the load balancer is routing around it. Should this page an on-call engineer at 3am?"}
        options={[
          "Yes — any internal anomaly of that size should always page immediately, better safe than sorry",
          "No — this is a cause-level internal signal with no observed user-facing symptom; it's worth a dashboard or a lower-urgency ticket, not a page, unless it starts actually burning the error budget",
          "No — GC pauses are never worth monitoring or recording at all",
          "Yes — GC pauses always precede a full outage, so this should be treated as equivalent to detection of an active incident"
        ]}
        correctIndex={1}
        explanation={"This is the symptom-vs-cause distinction in practice. Nobody outside the system is experiencing anything right now — error rate and latency, the actual symptoms users would feel, are flat. Paging on every internal condition that could theoretically matter (and usually self-corrects, as this one did) trains engineers to ignore pages. The right response is to record it for context and page only if it starts showing up as a real symptom — elevated errors, elevated latency, or burning the error budget faster than sustainable."}
      />
    </LessonLayout>
  );
}
