import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function DddCheatsheet() {
  return (
    <GuideLayout
      title="DDD"
      kicker="FIELD GUIDE"
      glyph="🧬"
      tagline="Domain-Driven Design — strategic and tactical vocabulary, verified against the six lessons that precede this page."
      meta={['Evans, 2003', '11 panels']}
      page="1 / 1"
      footer="This page is for recall. The lessons in this section carry the reasoning, the worked Java, and the compiled/tested proof."
      prev={{ path: '/ddd/spring-boot', label: 'DDD in a Spring Boot Codebase' }}
      next={null}
    >
      <GuidePanel n={1} title="Origin & Core Idea" accent="blue" glyph="📖">
        <GuideCode>{`"Domain-Driven Design" — Eric Evans, 2003
Domain-Driven Design: Tackling Complexity
in the Heart of Software`}</GuideCode>
        <GuideRules items={[
          'DDD is a MODELING discipline first. Entity, Value Object and Aggregate are secondary, tactical tools — not the point.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Strategic DDD — Vocabulary" accent="purple" glyph="🗺️">
        <GuideDefs
          items={[
            ['Ubiquitous Language', 'the same word means the same thing, consistently, WITHIN one boundary'],
            ['Bounded Context', 'the boundary itself — the same word CAN mean something different in a different bounded context, and that’s correct, not a bug'],
            ['Context Mapping', 'how separate bounded contexts relate to each other'],
          ]}
        />
        <GuideRules items={['Strategic DDD decides WHERE a boundary goes.']} />
      </GuidePanel>

      <GuidePanel n={3} title="Context Mapping Patterns" accent="green" glyph="🔗" span={2}>
        <GuideTable
          head={['Pattern', 'What it means']}
          rows={[
            ['Shared Kernel', 'Two contexts deliberately share a small, jointly-owned piece of the model'],
            ['Customer-Supplier', "Downstream has real influence over upstream's roadmap/interface"],
            ['Conformist', "Downstream just accepts upstream's model as-is, no influence, no translation"],
            ['Anti-Corruption Layer', "Most practically important — a translation layer so an upstream/legacy model can't contaminate your own"],
            ['Open Host Service', 'A published, well-defined API meant for many consumers (a REST/gRPC API is one in practice)'],
            ['Published Language', 'A shared, documented interchange format (often paired with Open Host Service)'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={4} title="Tactical DDD — Vocabulary" accent="amber" glyph="🧩">
        <GuideDefs
          items={[
            ['Entity', 'identity persists across state changes'],
            ['Value Object', 'no identity — equal if all fields are equal'],
            ['Aggregate / Root', 'a consistency boundary; external code may only reference the Aggregate ROOT directly'],
            ['Domain Event', 'something that happened, named past-tense'],
            ['Repository', 'gives the illusion of an in-memory collection of Aggregate Roots — never exposes a child entity independently of its root'],
          ]}
        />
        <GuideRules items={['Tactical DDD operates INSIDE one already-decided boundary.']} />
      </GuidePanel>

      <GuidePanel n={5} title="Value Object vs Entity — Verified" accent="pink" glyph="⚖️">
        <GuideCode>{`// Value Object: equal if fields are equal, no identity
new Money(10, "USD").equals(new Money(10, "USD"))   // -> true
// even though they're different object references

// Entity: equal if IDENTITY matches, fields are irrelevant
// same ID, totally different fields -> equals() == true
// different IDs, identical fields    -> equals() == false`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={6} title="Aggregate Root Enforces Invariants" accent="cyan" glyph="🛡️">
        <GuideCode>{`order.addLine(...)  // on a CANCELLED order
// -> throws IllegalStateException, verified, not just asserted`}</GuideCode>
        <GuideRules items={['An Aggregate Root enforces its OWN invariants on every mutation — that is the entire point of the boundary.']} />
      </GuidePanel>

      <GuidePanel n={7} title="Event Storming" accent="red" glyph="🗒️">
        <GuideDefs
          items={[
            ['Invented by', 'Alberto Brandolini, ~2013'],
            ['Technique', 'domain events on sticky notes with real domain experts in the room, laid out in a timeline'],
          ]}
        />
        <GuideRules items={[
          'Clusters of related events are what reveal bounded context boundaries in a real, messy domain — the practical technique for finding what Strategic DDD says should exist.',
          "The colour-coding legend is genuinely contested across sources (yellow = actor vs. aggregate; pink = hotspot vs. external system, depending who you ask) — don't trust any single online legend as canonical, including this one.",
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Spring Boot Anti-Pattern — Reproduced" accent="blue" glyph="🚨" span={2}>
        <GuideCode>{`Exposing Spring Data's JpaRepository<Order, Long> to callers lets
ANYONE call deleteById() / save() directly — bypassing every
invariant the aggregate root enforces in its own methods.

Reproduced with a @DataJpaTest: shipped an order (calling cancel()
on it would throw), then called the RAW repository's deleteById()
directly — the shipped order vanished with NO exception.`}</GuideCode>
        <GuideRules items={['Verified with a real @DataJpaTest, not asserted from memory.']} />
      </GuidePanel>

      <GuidePanel n={9} title="The Fix — Narrow Repository Interface" accent="purple" glyph="🔧">
        <GuideRules items={[
          'Wrap Spring Data JPA behind a narrower Repository interface (package-private impl) that only exposes aggregate-safe operations.',
          'Never expose the full JpaRepository surface to callers — that surface is exactly what let deleteById() bypass the aggregate.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="The Honest Cost" accent="green" glyph="⚠️">
        <GuideRules items={[
          'Not worth it for a simple CRUD entity with no cross-field invariants.',
          'More classes, more indirection — a real cost. Pay it only when the domain has genuine behavioral complexity worth protecting.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Section Index" accent="amber" glyph="📚" span={2}>
        <GuideDefs
          items={[
            ['1. Why Domain-Driven Design', 'Ubiquitous language, when DDD is worth it'],
            ['2. Strategic DDD', 'Bounded contexts, context mapping'],
            ['3. Tactical DDD', 'Entity, Value Object, Aggregate'],
            ['4. Domain Events & the Repository Pattern', 'Events, DDD-flavored Repository'],
            ['5. Event Storming', 'Workshop technique to FIND bounded contexts'],
            ['6. DDD in a Spring Boot Codebase', 'The real, compiled, tested payoff'],
            ['7. This page', 'Field guide — the recall sheet'],
          ]}
        />
      </GuidePanel>
    </GuideLayout>
  );
}
