import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function DddEventStorming() {
  return (
    <LessonLayout
      title="Event Storming: Discovering Bounded Contexts"
      sectionId="ddd"
      lessonIndex={4}
      prev={{ path: '/ddd/domain-events', label: 'Domain Events & the Repository Pattern' }}
      next={{ path: '/ddd/spring-boot', label: 'DDD in a Spring Boot Codebase' }}
    >
      <p>
        The strategic lessons made a claim that is easy to nod along with and hard to actually do:
        a large domain should be split into <strong>bounded contexts</strong>, each with its own
        <strong> ubiquitous language</strong>. Fine — but *where* are the seams? Nobody hands you a
        diagram with the boundaries pre-drawn. A real business's rules live scattered across
        Slack threads, a 200-page requirements doc nobody re-reads, and the heads of three people
        who have never been in the same meeting. <strong>Event Storming</strong> is the concrete
        technique for turning that mess into a set of boundaries you can actually defend — not by
        an architect guessing from an org chart, but by getting the mess out onto a wall where
        everyone can see it at once.
      </p>

      <InfoBox variant="note" title="What kind of lesson this is">
        <p>
          Every other lesson in this course has a compiler backing it up: run the code, get a
          verdict. This one doesn't. Event Storming is a <strong>facilitation technique</strong> —
          a way of running a meeting — and there is no <code>javac</code> for a room full of
          people around a whiteboard. Where this page states something as settled (who invented
          it, the core mechanic, the two colors nobody disputes) that's backed by the historical
          record. Where it describes conventions that differ between practitioners — and several
          genuinely do — it says so explicitly instead of picking one and presenting it as gospel.
        </p>
      </InfoBox>

      <h2>Where This Came From</h2>
      <p>
        Event Storming was created by <strong>Alberto Brandolini</strong>, an Italian software
        consultant and founder of the training company Avanscoperta, around <strong>2013</strong>.
        The commonly told origin story — repeated by Brandolini himself and independently by
        multiple secondhand accounts — is that he was a guest trainer at Vaughn Vernon's
        Implementing Domain-Driven Design (IDDD) tour, originally billing the session as
        &quot;event-based modelling,&quot; and renamed it to &quot;EventStorming&quot; at the last
        minute before going on stage in Leuven, Belgium. It grew directly out of{' '}
        <strong>Domain-Driven Design</strong> — the goal was a faster, more collaborative way to
        do what DDD had always asked for (find the domain experts, learn their language, find the
        seams) without the multi-week interview-and-document cycle that made it a hard sell on
        real projects.
      </p>

      <p>
        The core move is almost embarrassingly simple: put the domain experts and the engineers
        <strong> in the same room, at the same wall</strong>, with an oversized roll of paper (or
        a very large whiteboard) and a stack of colored sticky notes, and have the group build a
        timeline of everything that <em>happens</em> in the business — not a data model, not a UML
        diagram, just a chronological wall of events. No laptops. No pre-drawn boxes. The
        unlimited modeling surface is a deliberate part of the technique — Brandolini has written
        that a small whiteboard actively strangles the exercise, because people start editing
        down to fit the space instead of exploring. That specific detail — and the general
        rhythm of a session running a few hours rather than 30 minutes — is well attested across
        Brandolini's own writing and independent workshop write-ups, though exact timings are a
        matter of practitioner judgment, not a fixed rule.
      </p>

      <h3>Three levels, one technique</h3>
      <p>
        Brandolini's own material distinguishes a few different &quot;altitudes&quot; at which you
        run this workshop. This lesson is entirely about the first one:
      </p>
      <ul>
        <li>
          <strong>Big Picture</strong> — the level this lesson covers. Explore the whole business
          process chaotically, find the major events end to end, and use the resulting timeline to
          locate bounded contexts. Domain experts from multiple departments are in the room.
        </li>
        <li>
          <strong>Process Modeling</strong> — zoom into one already-identified area and work out
          the actual process flow in more detail: who does what, in what order, with which
          policies triggering which follow-on commands.
        </li>
        <li>
          <strong>Design Level</strong> — zoom in further, into the software itself. This is where
          the events and commands get attached to actual{' '}
          <strong>Aggregates</strong> and turn into the class design covered in the{' '}
          <strong>Tactical DDD</strong> lesson and the next lesson on Spring Boot.
        </li>
      </ul>
      <p>
        Keeping these levels straight matters for the rest of this page, because — as you'll see
        below — a chunk of the disagreement you'll find online about sticky-note colors is really
        just different sources describing different levels without saying so.
      </p>

      <h2>The Color Coding</h2>
      <p>
        Two colors are universal across every account of Event Storming — you will not find a
        credible source that disagrees on these:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Color</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Represents</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Agreement</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Orange</strong></td>
            <td style={{ padding: '0.75rem' }}>A <strong>domain event</strong> — something that happened, named in
              the past tense: <code>OrderPlaced</code>, <code>PaymentFailed</code></td>
            <td style={{ padding: '0.75rem' }}>Universal</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Blue</strong></td>
            <td style={{ padding: '0.75rem' }}>A <strong>command</strong> — an intent to do something, named as an
              imperative: <code>PlaceOrder</code>, <code>AuthorizePayment</code></td>
            <td style={{ padding: '0.75rem' }}>Universal</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Yellow</strong></td>
            <td style={{ padding: '0.75rem' }}>An <strong>actor/persona</strong> who issues a command (most sources,
              Big Picture level) <em>or</em> an <strong>Aggregate</strong> that owns a command/event pair
              (some sources, particularly Design Level)</td>
            <td style={{ padding: '0.75rem' }}>Contested</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Pink / Red</strong></td>
            <td style={{ padding: '0.75rem' }}>A <strong>hotspot</strong> — a known problem, risk, or open question
              the group can't resolve on the spot (most common) — but some sources instead use pink for an{' '}
              <strong>external system</strong>, and at least one widely-shared cheat sheet uses it for a{' '}
              <strong>bounded-context label</strong></td>
            <td style={{ padding: '0.75rem' }}>Most contested color</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Purple / Lilac</strong></td>
            <td style={{ padding: '0.75rem' }}>A <strong>policy</strong> — a reactive business rule of the shape
              &quot;whenever <em>event</em>, then <em>command</em>&quot;</td>
            <td style={{ padding: '0.75rem' }}>Widely used, not universal</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Green</strong></td>
            <td style={{ padding: '0.75rem' }}>A <strong>read model / view</strong> — a rough sketch of what a user
              needs to see to issue the next command</td>
            <td style={{ padding: '0.75rem' }}>Common addition, not part of the original minimal set</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Large pink rectangle</strong></td>
            <td style={{ padding: '0.75rem' }}>An <strong>external system</strong> boundary (a payment processor, a
              carrier API) — distinct from the small pink hotspot note above, which is where the pink/red
              overloading actually comes from</td>
            <td style={{ padding: '0.75rem' }}>Common in Big Picture workshops</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Don't trust any single color legend you find online — including this one">
        <p>
          There is no governing body certifying Event Storming notation. Brandolini's own book and
          workshops are the closest thing to a canonical source, and even his material shifts
          vocabulary between the Big Picture and Design levels — yellow-for-actor makes sense
          before you've identified any Aggregates; yellow-for-Aggregate makes sense once you have.
          The practical takeaway isn't &quot;memorize the one true palette&quot; — it's{' '}
          <strong>agree on your team's palette in the first five minutes of the session and write
          it on the wall</strong>, because that's what every real account of running one of these
          workshops actually does.
        </p>
      </InfoBox>

      <h2>A Worked Example: E-Commerce Checkout</h2>
      <p>
        Here's what an actual (compressed) slice of a Big Picture wall looks like partway through a
        session — after the group has been chaotically slapping up events for twenty minutes, before
        anyone has tried to organize anything:
      </p>

      <CodeBlock language="text" title="The wall, roughly as the room left it (unsorted, chronological left to right)">
{`[Customer]  (AddItemToCart)     -> ItemAddedToCart
[Customer]  (RemoveItem)        -> ItemRemovedFromCart
[Customer]  (StartCheckout)     -> CheckoutStarted

  ??? HOTSPOT: price shown at checkout can differ from the price when the
      item was added to the cart — nobody in the room agrees whose bug that is

[30-minute idle timer]          -> CartAbandoned        <- no human issued this command
                                                              a policy did: "whenever a cart sees no
                                                              activity for 30 minutes, abandon it"

[Customer]  (PlaceOrder)        -> OrderPlaced

  POLICY: "whenever OrderPlaced, then AuthorizePayment"

[Payment Gateway]  (AuthorizePayment) -> PaymentAuthorized
[Payment Gateway]  (AuthorizePayment) -> PaymentFailed        <- alternate outcome, same command

  POLICY: "whenever PaymentFailed, then CancelOrder"
  POLICY: "whenever PaymentAuthorized, then ReserveInventory"

[Warehouse System]  (ReserveInventory) -> InventoryReserved
[Warehouse System]  (ReserveInventory) -> InventoryReservationFailed

  ??? HOTSPOT: payment already succeeded but inventory reservation just
      failed — who issues the refund, and how fast does that have to happen?
      (nobody in the room can answer this without pulling in Finance)

[Warehouse System]  (ShipOrder)        -> OrderShipped
[Carrier API]       (ConfirmDelivery)  -> OrderDelivered

  POLICY: "whenever OrderPlaced, then SendOrderConfirmation"
  POLICY: "whenever OrderShipped, then SendShippingNotice"`}
      </CodeBlock>

      <p>
        Notice what's already there, even in this unsorted state: actors (<code>Customer</code>),
        external systems (<code>Payment Gateway</code>, <code>Carrier API</code>), commands, their
        resulting events — including <em>alternate</em> events for the same command, which is how
        failure paths surface early instead of getting bolted on later — reactive policies chaining
        one event into the next command, and two hotspots that are really just honest admissions
        that nobody in the room currently owns that decision. That last part is not a bug in the
        exercise. Surfacing &quot;we don't actually know&quot; in the first hour, in front of the
        people who could answer it, is a large part of the value.
      </p>

      <h3>The payoff: clusters reveal the seams</h3>
      <p>
        Once the timeline is out, the facilitator (or, better, the group itself) starts drawing
        vertical lines wherever the <strong>vocabulary changes owner</strong> — where &quot;the
        cart&quot; stops being the subject and &quot;the order&quot; takes over, where a human actor
        hands off to an external system, where the pace of events suddenly shifts. Do that to the
        wall above and the lines land in the same handful of places almost every time a group runs
        this exercise on a checkout flow — not because the answer was scripted, but because those
        are exactly the points where a different team, a different data model, and a different
        set of invariants would naturally take over:
      </p>

      <FlowChart
        title="Same events, after the room sorts them into clusters"
        chart={`graph LR
  subgraph Cart["Shopping Cart context"]
    A1[ItemAddedToCart]
    A2[CheckoutStarted]
    A3[CartAbandoned]
  end
  subgraph Ordering["Order Management context"]
    B1[OrderPlaced]
    B2[OrderCancelled]
  end
  subgraph Payment["Payment context"]
    C1[PaymentAuthorized]
    C2[PaymentFailed]
  end
  subgraph Fulfillment["Fulfillment context"]
    D1[InventoryReserved]
    D2[OrderShipped]
    D3[OrderDelivered]
  end
  subgraph Notify["Notifications context"]
    E1[OrderConfirmationSent]
  end

  A2 --> B1
  B1 -.->|policy: AuthorizePayment| C1
  B1 -.->|policy: AuthorizePayment| C2
  C2 -.->|policy: CancelOrder| B2
  C1 -.->|policy: ReserveInventory| D1
  D1 --> D2 --> D3
  B1 -.->|policy: SendOrderConfirmation| E1`}
      />

      <p>
        Five clusters fall out of one linear timeline: <strong>Cart</strong>,{' '}
        <strong>Ordering</strong>, <strong>Payment</strong>, <strong>Fulfillment</strong>, and{' '}
        <strong>Notifications</strong>. Each one has its own vocabulary (a &quot;cart&quot; has
        line items and quantities; an &quot;order&quot; has a total and a shipping address that's
        frozen at the moment it was placed; a &quot;payment&quot; has an authorization code that
        means nothing to the warehouse). Each one plausibly has different owners in a real
        organization — a payments team almost never reports to the same manager as a fulfillment
        team. And the dashed arrows crossing cluster boundaries are not implementation detail —
        they are the seam itself: every one of them is a domain event leaving one context and a
        policy in another context reacting to it, which is precisely the{' '}
        <strong>context mapping</strong> relationship the strategic-design lesson described in the
        abstract. Event Storming is what makes that relationship visible on a wall instead of
        asserted in a diagram nobody agrees with.
      </p>

      <InfoBox variant="tip" title="The tell to watch for while sorting">
        <p>
          The practitioner heuristic repeated across nearly every account of this exercise is the
          same one: watch for a <strong>pile-up</strong> — a run of several orange events that
          share a noun and a rhythm — followed by a sudden shift in vocabulary, actor, or pace. That
          seam is a bounded-context candidate. It's a heuristic, not an algorithm; two different
          rooms running the same business through this exercise can and do draw the lines slightly
          differently, and that's treated as normal, not as a sign someone did it wrong.
        </p>
      </InfoBox>

      <h2>What This Technique Cannot Do</h2>
      <p>
        Event Storming finds <em>candidate</em> boundaries — it does not prove they're correct, and
        it does not replace the judgment calls the strategic-design lesson covered (shared kernel
        vs. customer/supplier vs. anticorruption layer). It also degrades badly without real domain
        experts in the room: a room full of engineers event-storming their own guesses about the
        business will cheerfully produce a confident, well-organized, wrong wall. The technique's
        entire value proposition rests on getting people who actually know the business rules to
        physically stand at the wall and correct the sticky notes in real time — which also means
        it doesn't fit neatly into a fully asynchronous or fully remote-first process the way some
        other planning exercises do, though remote tooling for it does exist and is commonly used.
      </p>

      <InteractiveChallenge
        question="A group event-storms an insurance claims process. They notice a run of orange stickies — ClaimSubmitted, DocumentsUploaded, ClaimReviewed — all using the word 'claim,' followed by a sharp shift to a different vocabulary: PayoutCalculated, PayoutApproved, PayoutIssued, handled by a completely different department using terms like 'disbursement' and 'ledger entry.' What does this pattern most likely indicate?"
        options={[
          "A bug in the workshop — the group should merge these back into one continuous timeline",
          "Nothing structural — it's just two departments using different jargon for the same thing",
          "A likely bounded-context boundary — the vocabulary and ownership shift at exactly this seam, which is the pattern that usually corresponds to a real context boundary in the code and org chart",
          "That the second group of events should be deleted since they're redundant with the first"
        ]}
        correctIndex={2}
        explanation="A pile-up of related events sharing a vocabulary, followed by a sudden shift in language, actor, and pace, is the standard tell for a bounded-context seam. Here it lines up with a real organizational boundary too (claims handling vs. payouts/finance), which is exactly the kind of corroborating signal that makes a candidate boundary worth taking seriously — a separate Claims context and a separate Payments/Disbursement context, communicating by the ClaimReviewed event crossing into a policy that triggers PayoutCalculated."
      />
    </LessonLayout>
  );
}
