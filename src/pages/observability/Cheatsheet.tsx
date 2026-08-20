import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function ObservabilityCheatsheet() {
  return (
    <LessonLayout
      title="📋 Observability & SRE Cheat Sheet"
      sectionId="observability"
      lessonIndex={4}
      prev={{ path: '/observability/incidents', label: 'Alerting & Incident Response' }}
      next={null}
    >
      <p>
        A single-page reconciliation of every term, spec, and formula used across this section.
        Every source below was checked against a primary document somewhere in the four lessons
        that precede this one.
      </p>

      <h2>The Three Pillars</h2>

      <CodeBlock language="text" title="Metrics vs Logs vs Traces — and their contested origin">
{`Metrics   numeric time-series, cheap, good for "is something wrong
           right now" dashboards & alerting
Logs      discrete timestamped events, good for "what exactly
           happened" forensic detail, expensive at scale
Traces    one request's journey across services with timing at
           each hop — good for "WHERE did the latency/error happen"

Origin is genuinely contested, not single-source (verified):
  commonly attributed to  Cindy Sridharan, "Distributed Systems
                            Observability" (O'Reilly, 2018)
  predated by              Peter Bourgon's Feb 2017 post
  actively disputed by     Charity Majors (Honeycomb) — argues wide
                            structured events beat 3 separate silos

In practice the three increasingly overlap in modern tooling —
useful mental model, not a strict technical wall.`}
      </CodeBlock>

      <h2>SLIs, SLOs, SLAs — and the Error Budget Math</h2>

      <CodeBlock language="text" title="The distinction everyone conflates">
{`SLI   the MEASURED metric        "% of requests served <200ms"
SLO   the TARGET for that SLI     "99.9% over a rolling 30 days"
SLA   a CONTRACTUAL commitment,   often to an external customer,
       usually with financial/business consequences for missing it

Source: Google's "Site Reliability Engineering" (O'Reilly, 2016,
ed. Beyer/Jones/Petoff/Murphy) — the SLI/SLO/SLA definitions and the
error-budget mechanism are formalized there, chapters 3 & 4.`}
      </CodeBlock>

      <CodeBlock language="text" title="Error budget — computed, not eyeballed">
{`30-day window = 43,200 minutes total

SLO       Allowed downtime per 30 days
99%       432 minutes      (43,200 x 0.01)
99.9%     43.2 minutes     (43,200 x 0.001)
99.99%    4.32 minutes     (43,200 x 0.0001)
99.999%   0.432 minutes    (43,200 x 0.00001, ~26 seconds)

Each additional "nine" is an order of magnitude harder. This is the
actual mechanism that turns "reliability" into a negotiated resource:
budget not exhausted -> ship faster; budget exhausted -> freeze risky
changes, prioritize reliability work until it recovers.`}
      </CodeBlock>

      <h2>Distributed Tracing</h2>

      <CodeBlock language="text" title="Trace context propagation — the real current standard">
{`trace  = one request's full journey
span   = one unit of work within it (a service call, a DB query) —
          spans form a parent-child tree

W3C Trace Context — W3C Recommendation, Nov 23 2021 — the standard
that superseded vendor-specific headers (like B3's X-B3-TraceId etc):
  traceparent: version-trace_id-parent_id-trace_flags
  tracestate:  vendor-specific extra data

Sampling (can't trace everything at scale — verified vs OTel's docs):
  head-based   decide to sample at trace START, cheap, may miss rare
                outliers
  tail-based   buffer the WHOLE trace, decide after seeing the
                outcome ("keep all errors and all >2s traces") —
                more expensive, catches exactly what you'd want`}
      </CodeBlock>

      <h2>Alerting & Incident Response</h2>

      <CodeBlock language="text" title="Symptom-based vs cause-based — Google SRE book, verbatim">
{`"the 'what's broken' indicates the symptom; the 'why' indicates a
(possibly intermediate) cause" — SRE book, Monitoring Distributed Systems

Page on SYMPTOMS (elevated user-facing error rate/latency, or the
error budget burning too fast) — not on every internal cause, which
are numerous and often self-correct without user impact.

Standard incident lifecycle: Detection -> Triage -> Mitigation
(stop the bleeding, often faster than a full fix) -> Resolution ->
Postmortem.

Blameless postmortem: focuses on SYSTEMIC contributing factors
(missing alert, unclear runbook, dangerous deploy process), not
individual blame — because blame suppresses the honest reporting
needed to find the real systemic weakness. Directly traceable to
Google's SRE book "Postmortem Culture" chapter.

Runbooks: written and tested BEFORE the incident, not during it
under pressure — that's the entire point of having one.`}
      </CodeBlock>

      <InfoBox variant="info" title="Section Index">
        <p>
          1. The Three Pillars: Metrics, Logs, Traces &nbsp;·&nbsp; 2. SLIs, SLOs &amp; Error
          Budgets &nbsp;·&nbsp; 3. Distributed Tracing Design &nbsp;·&nbsp; 4. Alerting &amp;
          Incident Response &nbsp;·&nbsp; 5. This page
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          For where metrics and logs are actually implemented in this site's own stack, see the{' '}
          <strong>Spring Boot Observability</strong> lesson (Actuator, Micrometer).
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
