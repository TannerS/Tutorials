import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function ObservabilityCheatsheet() {
  return (
    <GuideLayout
      title="Observability & SRE"
      kicker="FIELD GUIDE"
      glyph="🔭"
      tagline="Metrics, logs, traces, SLOs and incident response — reconciled against a primary source for each claim."
      meta={['Google SRE book', 'W3C Trace Context', '9 panels']}
      page="1 / 1"
      footer="This page is for recall. The four lessons in this section carry the reasoning and the worked examples — see the Spring Boot Observability lesson for where metrics and logs are actually wired up (Actuator, Micrometer)."
      prev={{ path: '/observability/incidents', label: 'Alerting & Incident Response' }}
      next={null}
    >
      <GuidePanel n={1} title="The Three Pillars" accent="blue" glyph="🗼" span={2}>
        <GuideDefs
          items={[
            ['Metrics', 'numeric time-series — cheap, good for "is something wrong right now" dashboards & alerting'],
            ['Logs', 'discrete timestamped events — good for "what exactly happened" forensic detail, expensive at scale'],
            ['Traces', "one request's journey across services with timing at each hop — good for WHERE the latency/error happened"],
          ]}
        />
        <GuideRules
          items={[
            'The three increasingly overlap in modern tooling — useful mental model, not a strict technical wall.',
            'Origin is genuinely contested: commonly credited to Cindy Sridharan (2018), predated by Peter Bourgon\'s Feb 2017 post, and disputed by Charity Majors, who argues wide structured events beat three separate silos.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={2} title="SLI vs SLO vs SLA" accent="purple" glyph="🎯">
        <GuideDefs
          items={[
            ['SLI', 'the MEASURED metric — "% of requests served <200ms"'],
            ['SLO', 'the TARGET for that SLI — "99.9% over a rolling 30 days"'],
            ['SLA', 'a CONTRACTUAL commitment, often external, usually with financial/business consequences for missing it'],
          ]}
        />
        <GuideRules items={["Formalized in Google's SRE book (O'Reilly, 2016, ed. Beyer/Jones/Petoff/Murphy), chapters 3 & 4."]} />
      </GuidePanel>

      <GuidePanel n={3} title="Error Budget Math" accent="green" glyph="🧮" span={2}>
        <GuideCode>{`30-day window = 43,200 minutes total

SLO       Allowed downtime per 30 days
99%       432 minutes      (43,200 x 0.01)
99.9%     43.2 minutes     (43,200 x 0.001)
99.99%    4.32 minutes     (43,200 x 0.0001)
99.999%   0.432 minutes    (43,200 x 0.00001, ~26 seconds)`}</GuideCode>
        <GuideRules
          items={[
            'Each additional "nine" is an order of magnitude harder.',
            'This is the mechanism that turns reliability into a negotiated resource: budget not exhausted -> ship faster; budget exhausted -> freeze risky changes, prioritize reliability work.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={4} title="Trace & Span" accent="amber" glyph="🧵">
        <GuideDefs
          items={[
            ['trace', "one request's full journey"],
            ['span', 'one unit of work within it (a service call, a DB query) — spans form a parent-child tree'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={5} title="W3C Trace Context" accent="pink" glyph="🔗">
        <GuideCode>{`traceparent: version-trace_id-parent_id-trace_flags
tracestate:  vendor-specific extra data`}</GuideCode>
        <GuideRules items={['W3C Recommendation, Nov 23 2021 — superseded vendor-specific headers like B3\'s X-B3-TraceId.']} />
      </GuidePanel>

      <GuidePanel n={6} title="Sampling Strategies" accent="cyan" glyph="🎲">
        <GuideDefs
          items={[
            ['head-based', 'decide to sample at trace START — cheap, may miss rare outliers'],
            ['tail-based', 'buffer the WHOLE trace, decide after seeing the outcome ("keep all errors and all >2s traces") — more expensive, catches exactly what you\'d want'],
          ]}
        />
        <GuideRules items={["Can't trace everything at scale — verified against OpenTelemetry's docs."]} />
      </GuidePanel>

      <GuidePanel n={7} title="Symptom vs Cause" accent="red" glyph="🚨" span={2}>
        <GuideCode>{`"the 'what's broken' indicates the symptom; the 'why' indicates a
(possibly intermediate) cause" — SRE book, Monitoring Distributed Systems`}</GuideCode>
        <GuideRules
          items={[
            'Page on SYMPTOMS: elevated user-facing error rate/latency, or the error budget burning too fast.',
            'Not on every internal cause — those are numerous and often self-correct without user impact.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={8} title="Incident Lifecycle" accent="blue" glyph="🔁">
        <GuideDefs
          items={[
            ['Detection', 'an alert or a human notices'],
            ['Triage', 'assess scope and severity'],
            ['Mitigation', 'stop the bleeding — often faster than a full fix'],
            ['Resolution', 'the actual fix lands'],
            ['Postmortem', 'write up what happened and why'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={9} title="Postmortems & Runbooks" accent="purple" glyph="📓" span={2}>
        <GuideRules
          items={[
            'Blameless postmortem: focuses on SYSTEMIC contributing factors (missing alert, unclear runbook, dangerous deploy process), not individual blame — blame suppresses the honest reporting needed to find the real systemic weakness. Directly traceable to the SRE book\'s "Postmortem Culture" chapter.',
            'Runbooks: written and tested BEFORE the incident, not during it under pressure — that is the entire point of having one.',
          ]}
        />
      </GuidePanel>
    </GuideLayout>
  );
}
