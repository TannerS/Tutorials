import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function ArchitectureDocsAdrs() {
  return (
    <LessonLayout
      title="Architecture Decision Records"
      sectionId="architecture-docs"
      lessonIndex={0}
      prev={null}
      next={{ path: '/architecture-docs/c4-model', label: 'The C4 Model for Architecture Diagrams' }}
    >
      <p>
        An Architecture Decision Record (ADR) is a short, timestamped document that captures{' '}
        <strong>one</strong> significant architectural decision: the context that forced it, the
        decision itself, and the consequences of making it. Not a design doc, not a wiki page, not a
        Confluence page someone edits every quarter to keep it &quot;current.&quot; An ADR is written
        once, at the moment a decision is made, and then left alone.
      </p>

      <p>
        The practice traces to a specific source: Michael Nygard&apos;s November 15, 2011 post{' '}
        <strong>&quot;Documenting Architecture Decisions&quot;</strong>, published on Cognitect&apos;s
        blog. Teams had design docs before that, obviously, but Nygard is the one who named the
        format, gave it a template, and argued for treating decisions as discrete, numbered,
        append-only records rather than sections of a living document that gets rewritten as opinions
        change. That distinction — append-only versus living — is the whole point, and it is easy to
        lose if you have not read the original argument.
      </p>

      <h2>The Original Template</h2>

      <p>
        Nygard&apos;s post proposes five parts. Worth being precise about this because the order gets
        reshuffled in a lot of secondary write-ups: the original post presents them as{' '}
        <strong>Title, Context, Decision, Status, Consequences</strong> — Status comes fourth, after
        the decision has already been stated, not immediately under the title. Plenty of teams and
        tools (adr-tools, most GitHub templates you will find today) put Status second, right under
        the Title, because you want to know at a glance whether a record is still live before reading
        the reasoning — that is a reasonable, widely-adopted reordering, just not what the 2011 post
        itself shows.
      </p>

      <ul>
        <li><strong>Title</strong> — a short noun phrase, numbered. Nygard&apos;s own examples: &quot;ADR 1: Deployment on Ruby on Rails 3.0.10&quot;, &quot;ADR 9: LDAP for Multitenant Integration.&quot;</li>
        <li><strong>Context</strong> — the forces at play (technical, business, political, team) written in neutral, factual language, not an argument for the decision.</li>
        <li><strong>Decision</strong> — the response to those forces, stated as an imperative in full sentences: &quot;We will &hellip;&quot;</li>
        <li><strong>Status</strong> — proposed, accepted, deprecated, or superseded (with a reference to whatever replaced it).</li>
        <li><strong>Consequences</strong> — the resulting context after the decision lands, positive, negative, and neutral. Nygard is explicit that this section should not be a highlight reel: &quot;all consequences should be listed here, not just the &lsquo;positive&rsquo; ones.&quot;</li>
      </ul>

      <InfoBox variant="note" title="A Common Extension: Options Considered">
        <p>
          Nygard&apos;s original five parts do not include a dedicated &quot;Options Considered&quot;
          section — the Context section was meant to carry that weight implicitly. In practice, a lot
          of teams found that insufficient once decisions got contentious, and added an explicit
          options/alternatives section listing what else was on the table and why it lost. This is
          real, widespread practice — it is what the community-maintained{' '}
          <strong>MADR (Markdown Architectural Decision Records)</strong> template does, for
          instance — but it is an extension teams layered on afterward, not part of the original 2011
          template. Worth knowing the difference so you do not go looking for &quot;Options
          Considered&quot; in the source material and come up empty.
        </p>
      </InfoBox>

      <h2>The Property That Makes ADRs Different From a Wiki Page</h2>

      <p>
        A wiki page gets edited in place. Someone changes the database choice, someone else edits the
        &quot;Database&quot; page to reflect the new choice, and the history of <em>why</em> the old
        choice was made — and why it stopped being right — quietly disappears into page-edit history
        nobody reads.
      </p>

      <p>
        An ADR is <strong>immutable once accepted</strong>. If a decision changes later, you do not go
        back and edit ADR-0004 to describe the new choice. You write a new one — ADR-0011, say — that
        explains the new decision and explicitly supersedes ADR-0004. The old record stays exactly as
        it was, marked <code>Superseded by ADR-0011</code>, permanently readable. This is precisely
        what Nygard describes: <em>&quot;If a decision is reversed, we will keep the old one around,
        but mark it as superseded. (It&apos;s still relevant to know that it was the decision, but is
        no longer the decision.)&quot;</em>
      </p>

      <p>
        That property is the entire value proposition. Six months from now, someone on the team asks
        &quot;why do we have both PostgreSQL and MongoDB running in production?&quot; A wiki page
        answers that with whatever the last editor happened to leave behind. A chain of ADRs answers it
        with the actual sequence of reasoning: what the constraints were when the first choice was
        made, what changed, and what replaced it — in order, with nothing silently erased.
      </p>

      <h2>Status Values and What Triggers Each</h2>

      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Meaning</th>
            <th>Triggered by</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Proposed</strong></td>
            <td>Written, under discussion, not yet agreed</td>
            <td>Someone opens the ADR as a PR / draft for review</td>
          </tr>
          <tr>
            <td><strong>Accepted</strong></td>
            <td>Stakeholders agreed; this is the live decision</td>
            <td>Review lands — approval, usually via the same PR merge</td>
          </tr>
          <tr>
            <td><strong>Deprecated</strong></td>
            <td>No longer recommended, but nothing formally replaced it yet</td>
            <td>The decision stops being good practice (e.g. the underlying tech loses support) without a direct replacement decision</td>
          </tr>
          <tr>
            <td><strong>Superseded</strong></td>
            <td>Explicitly replaced by a specific later ADR</td>
            <td>A new ADR is accepted that reverses or replaces this one — link both directions</td>
          </tr>
        </tbody>
      </table>

      <h2>Where Teams Keep Them</h2>

      <p>
        Nygard&apos;s own post states the storage convention plainly: <em>&quot;We will keep ADRs in
        the project repository under doc/arch/adr-NNN.md.&quot;</em> The exact folder name has drifted
        since — today the most common convention is <code>docs/adr/</code> or{' '}
        <code>docs/architecture/decisions/</code> — but the underlying idea from the original post is
        unchanged and is genuinely how most teams do it now: ADRs live as plain Markdown files{' '}
        <strong>inside the repository</strong>, versioned alongside the code they describe, reviewed
        through the same pull-request process as everything else. Not a wiki, not a separate
        documentation tool nobody remembers to update — a directory that shows up in{' '}
        <code>git log</code> and <code>git blame</code> like any other file.
      </p>

      <h2>A Worked Example</h2>

      <p>
        A realistic ADR for a Spring Boot backend choosing its primary datastore — this is the shape a
        real one takes, not a template with the blanks left in:
      </p>

      <CodeBlock language="markdown" title="doc/arch/adr-0004-postgresql-for-orders-service.md">
{`# ADR-0004: Use PostgreSQL Over MongoDB for the Orders Service

## Status

Accepted

## Context

The Orders Service is being split out of the monolith as its own Spring Boot
application with its own database. Two candidates were evaluated: PostgreSQL
and MongoDB (the team already runs both in production for other services, so
neither introduces new operational surface area).

The Orders domain is relational by nature: an order has line items, each line
item references a product and a price at time of purchase, an order has
exactly one shipping address and one billing address, and refunds must
reference the original order and be constrained to not exceed the original
total. Reporting also needs to join orders against customers, promotions, and
inventory reservations for finance and support tooling.

The service must guarantee that "reserve inventory, charge payment, create
order" either all happen or none do — a partial write here means charging a
customer for stock that was never reserved.

## Decision

We will use PostgreSQL 15 as the primary datastore for the Orders Service,
accessed via Spring Data JPA.

## Consequences

**Positive**

- Multi-table transactions (order + line items + inventory reservation) are
  atomic via standard ACID transactions — no saga or outbox pattern is needed
  for the core order-creation path.
- Foreign key constraints enforce referential integrity at the database level
  (a line item cannot reference a deleted product) instead of relying on
  application code to keep this consistent.
- The reporting joins the finance team already asked for (orders x customers
  x promotions) are plain SQL joins, not application-level stitching across
  collections.
- The team has more existing PostgreSQL operational experience than MongoDB
  experience, which was a factor in on-call readiness.

**Negative**

- Schema changes require migrations (Flyway) and a deploy step, versus
  MongoDB's schema flexibility — adding a field to an order requires a
  migration, not just writing a new shape.
- Horizontal write scaling is harder than with MongoDB's native sharding; if
  Orders write volume outgrows a single primary, this decision will need
  revisiting (read replicas cover read scaling in the meantime).

**Neutral**

- Order documents that used to be flexible, nested JSON blobs in the
  monolith's MongoDB collection will be normalized into orders, order_items,
  and order_addresses tables. The one-time migration script is tracked
  separately in ADR-0005.`}
      </CodeBlock>

      <InfoBox variant="tip" title="One Decision Per ADR">
        <p>
          Notice the worked example does not also decide the caching layer, the message queue, or the
          API versioning scheme. Cramming multiple decisions into one ADR is a common mistake — it
          makes the record impossible to supersede cleanly later, because superseding the caching
          choice would mean also touching the database decision buried in the same file. One
          significant decision, one record.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"Six months after ADR-0004 (PostgreSQL for the Orders Service) is accepted, write throughput outgrows a single primary and the team switches to a sharded document store instead. What is the correct way to update the documentation?"}
        options={[
          "Edit ADR-0004 in place to describe the new sharded document store, since it reflects current reality",
          "Delete ADR-0004 since it's no longer accurate",
          "Write a new ADR that documents the new decision and marks it as superseding ADR-0004; ADR-0004 itself is edited only to update its Status to \"Superseded by ADR-00xx\"",
          "Add a comment at the bottom of ADR-0004 with the new decision"
        ]}
        correctIndex={2}
        explanation={"ADRs are immutable once accepted — that's the property that makes them trustworthy history instead of a wiki page nobody trusts. The original decision, and the context that made it correct at the time, stays exactly as written. A new ADR captures the new decision and explicitly supersedes the old one; the old one's Status field is updated to point at it, but its Context/Decision/Consequences are never rewritten."}
      />
    </LessonLayout>
  );
}
