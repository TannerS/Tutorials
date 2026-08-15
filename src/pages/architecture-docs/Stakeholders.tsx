import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function ArchitectureDocsStakeholders() {
  return (
    <LessonLayout
      title="Presenting Architecture to Stakeholders"
      sectionId="architecture-docs"
      lessonIndex={4}
      prev={{ path: '/architecture-docs/quality-attributes', label: 'Quality Attributes & Trade-off Analysis' }}
      next={{ path: '/architecture-docs/cheatsheet', label: '📋 Cheat Sheet' }}
    >
      <p>
        The previous four lessons produce documents: an ADR that records a decision and its
        alternatives, a C4 diagram that shows a system at the right level of abstraction, an NFR
        list that makes the invisible requirements explicit, a quality-attribute trade-off analysis
        that scores options against each other. All of that work has a purpose beyond the documents
        themselves — it exists to get a real decision made by someone who controls budget, timeline,
        or risk tolerance, and who was not in the room for the technical analysis. This lesson is
        about that conversation: how to walk in with solid engineering work and walk out with an
        actual decision, instead of a stakeholder who nodded along and understood none of it.
      </p>

      <InfoBox variant="note" title="What's Verifiable Here, and What Isn't">
        <p>
          Two claims in this lesson are documented history with a citable origin, and they are
          flagged as such where they appear: the origins of <strong>BLUF</strong> and the{' '}
          <strong>Pyramid Principle</strong>. Everything else — how to phrase a trade-off for a
          non-engineer, how to handle a stakeholder pushing for certainty you don't have — is{' '}
          <strong>practitioner consensus</strong>: widely taught and widely practiced among
          architects and technical communicators, but not the kind of claim you could footnote to a
          single source. Treat it as strong, common advice worth adapting to your own room, not as a
          settled fact the way &quot;SHA-256 has no inverse&quot; is a settled fact.
        </p>
      </InfoBox>

      <h2>The Translation Problem</h2>

      <p>
        Engineers reason in quality attributes: latency, consistency, availability, auditability,
        coupling. Executives and product stakeholders reason in risk, cost, and timeline. Both
        groups are reasoning about the same decision — the failure mode is not that one side is
        wrong, it's an architect presenting the first vocabulary to an audience that only has the
        second one, and watching the room politely disengage. The job is <strong>translation</strong>,
        not simplification: the stakeholder-facing version has to preserve the actual trade-off, not
        smooth it away into &quot;trust me, this is the right architecture.&quot;
      </p>

      <CodeBlock language="text" title="Translating Engineering Trade-offs for a Non-Engineering Audience">
{`DECISION 1 — Auditability for the ordering domain

  Engineer:    "We should adopt event sourcing for the ordering domain
                to get full auditability and temporal queries."

  Stakeholder: "This costs about 3 extra weeks of engineering now. In
                exchange, we gain the ability to answer 'what did this
                order look like on any date in the past' — which Legal
                needs for compliance and dispute resolution. Without
                this, we cannot answer that question at all, today or
                after we ship."

DECISION 2 — Decoupling checkout from inventory

  Engineer:    "We should decouple checkout from inventory with an
                async message queue instead of a synchronous call, for
                fault isolation and independent deployability."

  Stakeholder: "Right now, if the inventory system goes down, checkout
                goes down with it — nobody can buy anything. This costs
                about 2 weeks. After it, an inventory outage no longer
                stops sales: orders queue up and settle automatically
                once inventory is back."

DECISION 3 — Cart storage: consistency vs. scale

  Engineer:    "We should move the shopping cart to an eventually
                consistent store to handle Black-Friday-level write
                volume without added latency."

  Stakeholder: "This keeps the site fast during our highest-traffic day
                of the year instead of slowing down or falling over.
                The cost: for well under a second, two open tabs on the
                same cart might briefly disagree before they sync. For
                a cart, customers will never notice. We would NOT
                accept that same trade-off for the order ledger — that
                stays strongly consistent."

DECISION 4 — Caching the product catalog

  Engineer:    "We should put a 60-second-TTL cache in front of the
                product catalog endpoint to cut P95 latency under peak
                load."

  Stakeholder: "Product pages load roughly 4x faster during peak
                traffic, for about a day of engineering work. The
                cost: a price change can take up to 60 seconds to
                appear on the site after a merchandiser saves it.
                Checkout itself stays uncached, so what a customer
                actually pays at the register is always current."`}
      </CodeBlock>

      <p>
        Notice what survives the translation every time: a concrete cost (time, money, or a
        specific new risk) paired with a concrete consequence (a capability gained, or a failure
        mode closed). What gets dropped is the mechanism name — &quot;event sourcing,&quot;
        &quot;async messaging,&quot; &quot;eventual consistency,&quot; &quot;cache TTL.&quot; A
        stakeholder doesn't need the mechanism to make a good decision. They need the trade-off the
        mechanism produces.
      </p>

      <h2>Lead With the Recommendation, Not the Analysis</h2>

      <p>
        The default instinct for someone who just did careful analysis is to walk the room through
        it in the order they did the work: context, options considered, evaluation criteria,
        trade-off matrix, and then — at the end — the recommendation. That ordering rewards the
        analyst and punishes the audience. A stakeholder in a status meeting is not there to follow
        an argument for its own sake; they're listening for the one thing that affects a budget,
        roadmap, or risk they personally own, and if that doesn't show up until minute twelve of a
        twenty-minute slot, a meaningful fraction of the room has mentally left before it arrives.
      </p>

      <p>
        The fix is to invert the order: state the recommendation and its headline cost/benefit{' '}
        <strong>first</strong>, in one or two sentences, then use the remaining time to support it.
        Anyone satisfied with the headline can stop listening carefully at that point; anyone who
        wants to push back knows exactly what they're pushing back on, and can interrupt with a
        targeted question instead of sitting through an analysis whose conclusion they can't yet
        see.
      </p>

      <InfoBox variant="tip" title="Two Names for the Same Discipline">
        <p>
          This is a well-documented, independently-arrived-at pattern, not a single person's
          invention. In business communication it's usually called the <strong>Pyramid
          Principle</strong>: Barbara Minto developed it in the 1970s while at McKinsey, editing
          consultant reports that buried their conclusions under pages of build-up, and published it
          as <em>The Pyramid Principle: Logic in Writing and Thinking</em> in 1985 — lead with the
          answer, then group the supporting arguments beneath it.
        </p>
        <p>
          In military and government writing, the equivalent is <strong>BLUF</strong> — Bottom Line
          Up Front. It's formalized in the U.S. Army's own regulation on preparing correspondence
          (AR 25-50), which directs that the main point go at the beginning of a document, not the
          end. It's not a relic either — in 2017, U.S. Defense Secretary Jim Mattis directed that
          responses to Congressional inquiries &quot;give members of Congress the Bottom Line Up
          Front,&quot; specifically to cut through the same burying-the-lede problem in a much
          higher-stakes setting.
        </p>
      </InfoBox>

      <h2>Make the Trade-offs Visible</h2>

      <p>
        A common failure mode is presenting a single option as though it were the only reasonable
        path — the architect did real comparative analysis privately, settled on a favorite, and
        then shows leadership only that favorite, dressed up as &quot;the architecture.&quot; The
        stakeholder in that meeting isn't deciding anything; they're rubber-stamping a decision that
        was already made, without the information to weigh in with their own risk tolerance. If it
        goes wrong later, it's now solely the architect's decision to defend — the stakeholder never
        actually got to own any part of it.
      </p>

      <p>
        The alternative is presenting <strong>2–3 real options</strong> with honest trade-offs,
        including a &quot;do nothing&quot; baseline where that's a genuine option, so the
        stakeholder is actually choosing:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Option</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Cost / Timeline</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>What We Gain</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>What We Risk</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>A.</strong> Extract payments as its own service, async saga</td>
            <td style={{ padding: '0.75rem' }}>~6 weeks, 2 engineers</td>
            <td style={{ padding: '0.75rem' }}>A provider outage no longer blocks checkout; scales independently</td>
            <td style={{ padding: '0.75rem' }}>New failure mode — saga compensations need their own testing</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>B.</strong> Keep the monolith, add a circuit breaker + retry queue</td>
            <td style={{ padding: '0.75rem' }}>~1 week, 1 engineer</td>
            <td style={{ padding: '0.75rem' }}>Absorbs brief provider blips without a rewrite</td>
            <td style={{ padding: '0.75rem' }}>Doesn't help if the provider is down for hours, not seconds</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>C.</strong> Do nothing — keep the current synchronous call</td>
            <td style={{ padding: '0.75rem' }}>$0, no engineering time</td>
            <td style={{ padding: '0.75rem' }}>No new complexity or failure modes introduced</td>
            <td style={{ padding: '0.75rem' }}>Every provider outage still takes checkout down with it</td>
          </tr>
        </tbody>
      </table>

      <p>
        This table is not new work. The <strong>Options Considered</strong> and{' '}
        <strong>Consequences</strong> sections of an ADR are, close to verbatim, the middle and
        right columns above — that document already forces you to write down the alternatives you
        rejected and why. The stimulus/response pairs from a quality-attribute trade-off analysis
        are where the &quot;What We Risk&quot; column comes from. The stakeholder conversation isn't
        extra effort layered on top of that earlier work; it's that same material, restructured for
        an audience that wasn't in the room for the technical evaluation.
      </p>

      <InfoBox variant="danger" title="The One-Option Presentation">
        <p>
          Disclosing a recommendation is fine — &quot;we evaluated three approaches and recommend A
          for these reasons&quot; is exactly the BLUF pattern above. The failure is different:
          presenting only the winning option, with real alternatives omitted or reduced to a token,
          obviously-worse mention so the favorite looks inevitable. It removes the stakeholder's
          ability to apply their own judgment about risk, and it quietly moves full ownership of the
          outcome onto the architect alone — which feels safe until the decision goes wrong, at
          which point &quot;you never told us there was another way&quot; is a very reasonable thing
          for them to say.
        </p>
      </InfoBox>

      <h2>Handling Pushback Without Overpromising</h2>

      <p>
        The hardest moment in most of these conversations is a direct question with no clean, honest
        yes: &quot;Will this scale to 10x users?&quot; &quot;Can you guarantee the migration won't
        cause downtime?&quot; The stakeholder asking wants certainty. An honest architect frequently
        cannot give unconditional certainty, and the discipline is saying so precisely — stating what
        is verified, what is assumed, and what it would cost to close the gap — instead of resolving
        the discomfort by overpromising or retreating into jargon dense enough that the stakeholder
        can't push back on it.
      </p>

      <CodeBlock language="text" title="Three Answers to the Same Question">
{`Stakeholder: "Will this scale to 10x users?"

Overpromising (bad):
  "Yes, absolutely — the new architecture is built to scale."
  -> No load test backs this up. If it breaks at 10x, the architect
     said "yes" and now personally owns the gap between that answer
     and reality.

Jargon deflection (also bad):
  "We're using a horizontally scalable, event-driven microservices
  architecture with elastic auto-scaling groups."
  -> Possibly true. Still not an answer — it describes the mechanism,
     not the confidence level, and most stakeholders correctly read
     this as a dodge.

Stated confidence + assumptions (honest):
  "I load-tested the read path and I'm confident it holds at 10x —
  that covers product pages and search. I have NOT load-tested the
  write path past 3x, and that's the real risk: checkout writes to
  the order table, and I don't yet know where that breaks. Closing
  that gap is about two weeks of additional load testing. I'd want
  that done before we commit to a launch date built on 10x traffic."`}
      </CodeBlock>

      <p>
        The honest answer is longer, less comfortable to deliver, and doesn't resolve the room's
        desire for a clean yes. It's also the only one of the three that's true, and it's the only
        one that gives the stakeholder something to act on — fund two more weeks of testing, or
        knowingly accept the risk, rather than a confidence nobody can actually back up. As flagged
        at the top of this lesson, this specific piece is practitioner consensus rather than a
        citable fact: the underlying move — separating &quot;tested&quot; from &quot;assumed&quot;
        and saying which is which out loud — is exactly how a careful engineer already reasons
        internally about a system's limits. This is that same habit, made visible to someone who
        isn't in the codebase to see it for themselves.
      </p>

      <InfoBox variant="tip" title="Follow Up in Writing">
        <p>
          A verbal decision in a meeting is real, but memory of it degrades fast. Three weeks later,
          a stakeholder may recall approving &quot;the fast option&quot; without recalling which
          trade-off they accepted to get it, and an architect may recall a clear green light that
          was actually a &quot;let me think about it.&quot; A short written follow-up sent within a
          day protects both sides: it gives the stakeholder a record of exactly what they approved
          and why, to point to if someone asks them to justify it later, and it gives the architect a
          record of what was actually agreed to, rather than a memory that quietly shifts to match
          whatever is convenient in hindsight. This doesn't have to be new writing — it can literally
          be the <strong>Architecture Decision Record</strong> from earlier in this section, with the
          chosen option, the rejected alternatives, and the date it was decided.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
