import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function ArchitectureDocsCheatsheet() {
  return (
    <LessonLayout
      title="📋 Communicating Architecture Cheat Sheet"
      sectionId="architecture-docs"
      lessonIndex={5}
      prev={{ path: '/architecture-docs/stakeholders', label: 'Presenting Architecture to Stakeholders' }}
      next={null}
    >
      <p>
        A single-page reconciliation of every framework, template, and attribution used across
        this section. Every source below was checked against a primary document somewhere in the
        five lessons that precede this one.
      </p>

      <h2>Architecture Decision Records</h2>

      <CodeBlock language="text" title="Origin and the real template order (get this right)">
{`Michael Nygard, "Documenting Architecture Decisions," Nov 15 2011,
Cognitect blog. NOT before then — this is the traced origin of the
practice as a named thing.

The REAL original order (verified against the raw post, not memory):
  Title -> Context -> Decision -> Status -> Consequences
  Status is FOURTH. Most people misremember it as second, because
  modern tooling (adr-tools, common templates) reorders it that way.

"Options Considered" is NOT in Nygard's original 5 parts — it's a
widely-adopted extension (e.g. the community MADR template).

The property that makes an ADR different from a wiki page:
IMMUTABLE once accepted. A changed decision gets a NEW ADR that
supersedes the old one — you don't edit history.

Status values: Proposed -> Accepted -> (later) Deprecated / Superseded
Convention: keep them in the repo itself, e.g. docs/adr/ — Nygard's
own post: "We will keep ADRs in the project repository."`}
      </CodeBlock>

      <h2>The C4 Model</h2>

      <CodeBlock language="text" title="Created by Simon Brown — the four zoom levels">
{`C4 = Context, Container, Component, Code

Context     the WHOLE system as one box + its users + other systems
             it talks to. No internal detail.
Container   zoom into ONE system: its major deployable/runnable units
             (a web app, an API, a database, a queue) and how they talk.
             "Container" here does NOT mean Docker — the term predates
             Docker (named ~2010; Docker launched March 2013).
Component   zoom into ONE container: its major internal modules.
Code        zoom into ONE component — essentially a UML class diagram.
             Simon Brown's own site: "very much an optional level of
             detail... most IDEs can generate this on demand."

Two diagrams should be CONSISTENT: the Context diagram's one system
box is exactly what the Container diagram zooms into.

Mermaid graph TD/LR (what this site uses) is a reasonable way to draw
C4's CONCEPTUAL levels — it is NOT the official C4-PlantUML/Structurizr
notation the C4 ecosystem's own tooling typically uses. Be honest about
that distinction if you show these diagrams to someone who knows C4.`}
      </CodeBlock>

      <h2>Non-Functional Requirements — ISO/IEC 25010</h2>

      <CodeBlock language="text" title="The 8 top-level categories (2011 revision — still the most-cited version)">
{`Functional Suitability   Does it do the right things, completely & correctly?
Performance Efficiency  Time / CPU / memory / capacity under load
Compatibility            Coexist & exchange data with other systems?
Usability                Can people actually use it?
Reliability              Stays available and correct over time?
Security                Confidentiality, integrity, accountability
Maintainability          How costly to modify safely?
Portability               How easily does it move to a new environment?

Superseded the older ISO/IEC 9126 in 2011 (9126 missed emerging
concerns like security & interoperability). A 2023 revision exists
(adds "Safety," renames a couple of categories) — this list teaches
the 2011 set deliberately, because it's still what's overwhelmingly
cited in practice.

"Non-functional requirement" and "quality attribute" are used
interchangeably — architecture literature leans toward the latter.`}
      </CodeBlock>

      <h2>Quality Attribute Trade-off Analysis — ATAM</h2>

      <CodeBlock language="text" title="Architecture Tradeoff Analysis Method — SEI/Carnegie Mellon">
{`A quality attribute SCENARIO has 6 parts, verified against SEI's own
documentation (not a simplification):

  Source of stimulus   what entity generated the stimulus
  Stimulus             the condition that arrives
  Environment          system state when the stimulus arrived
  Artifact              what part of the system is stimulated
  Response              what the system should do about it
  Response measure      how you'll know it worked (a number)

ATAM vocabulary:
  Sensitivity point    a design decision one quality attribute is
                        highly sensitive to
  Trade-off point       a decision that affects MULTIPLE attributes,
                        often in opposite directions (adding a cache
                        is the classic example — helps performance,
                        hurts consistency)

Real, verified trade-off pairs: availability vs. consistency (CAP
theorem — see the Distributed Systems lesson), performance vs.
security (encryption/auth overhead — see the Cryptography section),
maintainability vs. time-to-market, scalability vs. cost.`}
      </CodeBlock>

      <h2>Presenting to Stakeholders</h2>

      <CodeBlock language="text" title="Translate quality-attribute reasoning into risk/cost/timeline">
{`Lead with the RECOMMENDATION, not the analysis (BLUF — Bottom Line
Up Front; formalized in US Army Regulation 25-50, reinforced 2017 when
Defense Secretary Mattis directed Congressional responses use it).
The Pyramid Principle (Barbara Minto, McKinsey, 1970s, published 1985)
is the same idea from business writing: conclusion first, support after.

Make trade-offs VISIBLE: present 2-3 real options with honest costs,
including "do nothing" where relevant — not one option dressed up as
the only reasonable path.

The ADRs and quality-attribute scenarios from earlier in this section
ARE the raw material for this conversation, not extra work.

State confidence levels and assumptions explicitly instead of either
overpromising or hiding behind jargon when asked a question you can't
honestly answer with certainty.`}
      </CodeBlock>

      <InfoBox variant="info" title="Section Index">
        <p>
          1. Architecture Decision Records &nbsp;·&nbsp; 2. The C4 Model &nbsp;·&nbsp;
          3. Non-Functional Requirements as a Framework &nbsp;·&nbsp;
          4. Quality Attributes &amp; Trade-off Analysis &nbsp;·&nbsp;
          5. Presenting Architecture to Stakeholders &nbsp;·&nbsp; 6. This page
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
