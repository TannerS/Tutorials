import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function DddCheatsheet() {
  return (
    <LessonLayout
      title="📋 Domain-Driven Design Cheat Sheet"
      sectionId="ddd"
      lessonIndex={6}
      prev={{ path: '/ddd/spring-boot', label: 'DDD in a Spring Boot Codebase' }}
      next={null}
    >
      <p>
        A single-page reconciliation of every term and pattern used across this section. Every
        attribution below was verified against a primary source somewhere in the six lessons that
        precede this one — nothing here is restated from memory.
      </p>

      <h2>The Vocabulary, Bottom to Top</h2>

      <CodeBlock language="text" title="Origin">
{`"Domain-Driven Design" — Eric Evans, 2003 book of the same name
(Domain-Driven Design: Tackling Complexity in the Heart of Software).

DDD is a MODELING discipline first. The tactical patterns below
(Entity, Value Object, Aggregate) are secondary tools, not the point.`}
      </CodeBlock>

      <CodeBlock language="text" title="Strategic vs Tactical — what operates where">
{`STRATEGIC DDD          decides WHERE a boundary goes
  Ubiquitous Language   the same word means the same thing,
                        consistently, WITHIN one boundary
  Bounded Context       the boundary itself — the same word CAN
                        mean something different in a different
                        bounded context, and that's correct, not a bug
  Context Mapping       how separate bounded contexts relate to
                        each other (see table below)

TACTICAL DDD            operates INSIDE one already-decided boundary
  Entity                identity persists across state changes
  Value Object          no identity — equal if all fields are equal
  Aggregate / Root       a consistency boundary; external code may only
                        reference the Aggregate ROOT directly
  Domain Event          something that happened, named past-tense
  Repository            gives the illusion of an in-memory collection
                        of Aggregate Roots — never exposes a child
                        entity independently of its root`}
      </CodeBlock>

      <h2>Context Mapping Patterns</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Pattern</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Shared Kernel</strong></td>
            <td style={{ padding: '0.75rem' }}>Two contexts deliberately share a small, jointly-owned piece of the model</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Customer-Supplier</strong></td>
            <td style={{ padding: '0.75rem' }}>Downstream has real influence over upstream's roadmap/interface</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Conformist</strong></td>
            <td style={{ padding: '0.75rem' }}>Downstream just accepts upstream's model as-is, no influence, no translation</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Anti-Corruption Layer</strong></td>
            <td style={{ padding: '0.75rem' }}>Most practically important — a translation layer so an upstream/legacy model can't contaminate your own</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Open Host Service</strong></td>
            <td style={{ padding: '0.75rem' }}>A published, well-defined API meant for many consumers (a REST/gRPC API is one in practice)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Published Language</strong></td>
            <td style={{ padding: '0.75rem' }}>A shared, documented interchange format (often paired with Open Host Service)</td>
          </tr>
        </tbody>
      </table>

      <h2>Tactical Patterns — the Distinction Everyone Blurs</h2>

      <CodeBlock language="java" title="Value Object vs Entity — verified, compiled, run">
{`// Value Object: equal if fields are equal, no identity
new Money(10, "USD").equals(new Money(10, "USD"))   // -> true
// even though they're different object references

// Entity: equal if IDENTITY matches, fields are irrelevant
// same ID, totally different fields -> equals() == true
// different IDs, identical fields    -> equals() == false

// Aggregate Root enforces its OWN invariants on every mutation:
order.addLine(...)  // on a CANCELLED order
// -> throws IllegalStateException, verified, not just asserted`}
      </CodeBlock>

      <InfoBox variant="info" title="Event Storming — the Bridge From Theory to Practice">
        <p>
          Invented by <strong>Alberto Brandolini</strong>, ~2013. A workshop technique: put domain
          events on sticky notes with actual domain experts in the room, lay them out in a
          timeline. <strong>Clusters of related events are what reveal bounded context
          boundaries</strong> in a real, messy domain — this is the practical technique for
          finding what Strategic DDD says should exist. The exact color-coding legend is genuinely
          contested across sources (yellow = actor vs. aggregate; pink = hotspot vs. external
          system, depending who you ask) — don't trust any single online legend as canonical,
          including a table on this site.
        </p>
      </InfoBox>

      <h2>The Real Spring Boot Anti-Pattern, Empirically Reproduced</h2>

      <CodeBlock language="text" title="Why JpaRepository<Order, Long> exposed directly is dangerous">
{`Exposing Spring Data's JpaRepository<Order, Long> to callers lets
ANYONE call deleteById() / save() directly — bypassing every
invariant the aggregate root enforces in its own methods.

Reproduced for real with a @DataJpaTest: shipped an order (calling
cancel() on it would throw), then called the RAW repository's
deleteById() directly — the shipped order vanished with NO exception.

Fix: wrap Spring Data JPA behind a narrower Repository interface
(package-private impl) that only exposes aggregate-safe operations —
never the full JpaRepository surface.`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Honest Cost — When NOT to Bother">
        <p>
          Every lesson in this section ends with the same honest caveat, worth repeating here:
          this pattern is <strong>not</strong> worth it for a simple CRUD entity with no
          cross-field invariants. More classes, more indirection, a real cost — pay it only when
          the domain has genuine behavioral complexity worth protecting.
        </p>
      </InfoBox>

      <h2>Section Index</h2>

      <CodeBlock language="text" title="All 7 lessons, in reading order">
{`1. Why Domain-Driven Design                  Ubiquitous language, when DDD is worth it
2. Strategic DDD                              Bounded contexts, context mapping
3. Tactical DDD                               Entity, Value Object, Aggregate
4. Domain Events & the Repository Pattern     Events, DDD-flavored Repository
5. Event Storming                             Workshop technique to FIND bounded contexts
6. DDD in a Spring Boot Codebase              The real, compiled, tested payoff
7. This page`}
      </CodeBlock>
    </LessonLayout>
  );
}
