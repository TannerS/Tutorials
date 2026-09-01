import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function DddStrategic() {
  return (
    <LessonLayout
      title="Strategic DDD: Bounded Contexts & Context Mapping"
      sectionId="ddd"
      lessonIndex={1}
      prev={{ path: '/ddd/intro', label: 'Why Domain-Driven Design' }}
      next={{ path: '/ddd/tactical', label: 'Tactical DDD: Entities, Value Objects & Aggregates' }}
    >
      <p>
        The previous lesson left the <code>Customer</code> example unresolved on purpose: a
        marketing team&apos;s &quot;customer&quot; (anyone who touched checkout, including cart
        abandoners) and a finance team&apos;s &quot;customer&quot; (anyone with a paid, invoiced
        order) are not the same concept, even though both teams use the same word. Strategic DDD is
        the formal answer to that gap — and it is also the piece this site&apos;s microservices
        content has been assuming was already solved.
      </p>

      <h2>Bounded Context: A Boundary Where a Model Is Consistent</h2>

      <p>
        A <strong>Bounded Context</strong> is a boundary within which a particular model — and the
        ubiquitous language that names it — applies consistently. Inside the boundary, every term
        means exactly one thing and every developer and domain expert agrees on it. Outside the
        boundary, that same term is allowed to mean something else entirely, in a different model,
        with a different ubiquitous language of its own. That is not a failure to standardize —
        DDD treats it as correct, as long as each context stays internally consistent and nobody
        pretends the two models are secretly the same thing.
      </p>

      <p>
        Apply that to <code>Customer</code>: a <strong>Billing context</strong> and a{' '}
        <strong>Shipping context</strong> can each have their own <code>Customer</code> model, and
        both can be right at the same time.
      </p>

      <CodeBlock language="java" title="Same Word, Two Legitimate Models">
{`// Billing context — a Customer is a billing/payment identity
public class Customer {
    private CustomerId id;
    private BillingAddress billingAddress;
    private PaymentMethod defaultPaymentMethod;
    private TaxId taxId;
    private CreditLimit creditLimit;
}

// Shipping context — a Customer is a delivery destination and preferences
public class Customer {
    private CustomerId id;             // same identity, different data
    private List<ShippingAddress> addresses;
    private DeliveryInstructions instructions;
    private boolean signatureRequired;
}`}
      </CodeBlock>

      <p>
        Neither class is wrong, and neither is &quot;the real Customer&quot; with the other as an
        incomplete copy. <code>CreditLimit</code> is meaningless to a warehouse pick-and-pack
        workflow; <code>DeliveryInstructions</code> is meaningless to accounts receivable. Forcing
        both into one shared <code>Customer</code> entity — the instinct that feels like avoiding
        duplication — is what produces the bloated, conditionally-valid god class from the previous
        lesson. The fix is not fewer models. It&apos;s clearly bounded ones, with an explicit,
        agreed relationship between them where they need to interact.
      </p>

      <InfoBox variant="note" title="The Missing Piece in 'Where Should This Microservice Boundary Go?'">
        <p>
          This site&apos;s microservices lessons — the eleven core patterns, CQRS, event-driven
          communication — all assume the service boundaries already exist and focus on how services
          <em> once split</em> should talk, stay consistent, and scale. Strategic DDD is the method
          for deciding <em>where those boundaries belong in the first place</em>. &quot;These
          functions feel related&quot; is not a boundary. &quot;These functions share one
          consistent model and ubiquitous language, and that model stops making sense past this
          point&quot; is. A bounded context is the unit that actually justifies a service boundary.
        </p>
      </InfoBox>

      <h2>Context Mapping: Naming the Relationship Between Contexts</h2>

      <p>
        Bounded contexts rarely stand alone — Billing needs data that originates in Sales, Shipping
        needs data that originates in Billing. Eric Evans&apos;s <strong>Context Mapping</strong>{' '}
        patterns give each of these relationships a name, so a team can say precisely how much
        influence one context has over another instead of leaving it as an unspoken assumption.
      </p>

      <h3>Shared Kernel</h3>
      <p>
        Two teams explicitly agree to share a small subset of the model — code, and usually the
        underlying schema, included — and both commit to not changing that subset without
        consulting the other team. Evans is explicit that the shared portion should stay{' '}
        <strong>small</strong>: a <code>Money</code> value object or an order identifier scheme are
        typical candidates. The moment the shared surface grows large, the coordination cost starts
        to erase the reason the contexts were split in the first place.
      </p>

      <h3>Customer-Supplier</h3>
      <p>
        An upstream/downstream relationship where the downstream team&apos;s needs are formally
        factored into the upstream team&apos;s planning — not an afterthought, a negotiated
        commitment with budgeted work and an agreed schedule. Sales producing order data that
        Billing depends on is a Customer-Supplier relationship <em>when</em> Billing&apos;s
        requirements actually get prioritized in Sales&apos;s backlog. If they don&apos;t, the
        relationship has silently become something else — usually Conformist, whether anyone
        decided that on purpose or not.
      </p>

      <h3>Conformist</h3>
      <p>
        The downstream team adopts the upstream team&apos;s model exactly as-is, with no
        translation layer, because the upstream team has no incentive to accommodate them —
        integrating with a large platform team, or a SaaS vendor, are typical cases. This trades
        model purity for integration simplicity. It is a legitimate, deliberate choice when the
        downstream domain doesn&apos;t care much about the distinction; it is a quiet liability when
        it does, because the upstream vocabulary leaks into a domain it doesn&apos;t actually fit.
      </p>

      <h3>Anti-Corruption Layer (ACL)</h3>
      <p>
        The most practically important pattern on this list. An <strong>Anti-Corruption Layer</strong>{' '}
        is a translation layer a downstream context builds so an upstream system&apos;s model never
        leaks into its own — the upstream system is used through its existing interface, unmodified,
        and the ACL translates in and out at the boundary. The canonical case is a legacy system or
        third-party API whose model doesn&apos;t match your domain&apos;s vocabulary at all:
      </p>

      <CodeBlock language="java" title="ACL: Translating a Legacy Payment Gateway's Model at the Boundary">
{`// The third-party gateway's own vocabulary — you don't control this shape.
class GatewayTransactionRecord {
    String merchantRef;
    String authCode;
    String avsResult;
    int amountInCents;
}

// The Anti-Corruption Layer: the ONLY place GatewayTransactionRecord
// is allowed to appear. Everything past this point speaks Billing's
// own ubiquitous language.
public class PaymentGatewayAcl {

    private final LegacyGatewayClient client;

    public PaymentResult charge(Invoice invoice, PaymentMethod method) {
        GatewayTransactionRecord raw = client.submitCharge(
            toGatewayRequest(invoice, method)
        );
        return translate(raw); // legacy fields never escape this class
    }

    private PaymentResult translate(GatewayTransactionRecord raw) {
        return new PaymentResult(
            new TransactionId(raw.merchantRef),
            raw.authCode != null ? PaymentStatus.AUTHORIZED : PaymentStatus.DECLINED,
            Money.ofCents(raw.amountInCents)
        );
    }
}`}
      </CodeBlock>

      <p>
        Without the ACL, <code>merchantRef</code> and <code>avsResult</code> end up scattered
        through Billing&apos;s domain logic, and every future gateway migration means hunting down
        every place the old vocabulary leaked in. With it, swapping payment providers means
        rewriting one class.
      </p>

      <h3>Open Host Service</h3>
      <p>
        An upstream context exposes its functionality through a well-defined, published protocol
        that anyone needing to integrate can use, instead of negotiating a bespoke integration per
        consumer. The upstream team commits to evolving that shared protocol deliberately, and
        handles a consumer&apos;s idiosyncratic needs with a one-off adapter on the consumer&apos;s
        side rather than special-casing the shared protocol itself. A well-designed public REST or
        gRPC API is an Open Host Service in practice.
      </p>

      <h3>Published Language</h3>
      <p>
        A well-documented, shared language — typically a schema (JSON Schema, an OpenAPI document, a
        Protobuf/Avro definition) — used as the actual medium of translation between two contexts.
        Open Host Service and Published Language are usually paired: the Open Host Service is{' '}
        <em>how</em> you expose the integration, the Published Language is the documented contract
        that both sides translate into and out of.
      </p>

      <FlowChart
        title="Five Bounded Contexts, All Six Context-Mapping Relationships"
        chart={"graph LR\n  Sales[\"Sales Context\"] -->|\"Customer-Supplier<br/>(Open Host Service +<br/>Published Language: order schema)\"| Billing[\"Billing Context\"]\n  Sales -->|\"Customer-Supplier<br/>(Open Host Service +<br/>Published Language: order schema)\"| Shipping[\"Shipping Context\"]\n  Billing <-->|\"Shared Kernel: Money, Address\"| Shipping\n  Billing -->|\"Anti-Corruption Layer\"| Gateway[\"Legacy Payment Gateway\"]\n  Shipping -->|\"Conformist\"| Carrier[\"Third-Party Carrier API\"]"}
      />

      <p>
        Reading that map: Sales is upstream of both Billing and Shipping, and formally accounts for
        their needs (Customer-Supplier) — and it exposes that relationship as an{' '}
        <strong>Open Host Service</strong>, publishing its order data through a documented{' '}
        <strong>Published Language</strong> (an order schema) rather than negotiating a bespoke
        integration with each downstream team individually. Billing and Shipping deliberately share
        a small, explicit kernel — value objects like <code>Money</code> and <code>Address</code> —
        small enough that both teams can afford to keep it synchronized. Billing depends on a legacy
        payment gateway it has zero influence over, so it protects itself with an Anti-Corruption
        Layer rather than letting the gateway&apos;s model dictate Billing&apos;s own. Shipping, by
        contrast, takes the third-party carrier API&apos;s tracking-status model as-is — a{' '}
        <strong>Conformist</strong> relationship: the carrier has no incentive to accommodate one
        delivery app among thousands of integrators, and Shipping has judged the mismatch small
        enough that a translation layer isn&apos;t worth building.
      </p>

      <InfoBox variant="warning" title="Misaligned Boundaries Are a Root Cause, Not a Style Nitpick">
        <p>
          When a microservice boundary is drawn along org-chart lines or &quot;these felt related&quot;
          instead of along a bounded context, the symptoms show up directly in the patterns the
          microservices lessons cover: services that should be autonomous end up making chatty,
          synchronous calls to fetch data because the model was split down the middle of a single
          concept, and teams reach for a shared database to paper over the fact that two
          &quot;services&quot; are actually one bounded context that got physically separated. A
          service boundary that respects a bounded context boundary needs comparatively little
          cross-service chatter, because the model that changes together lives together. A service
          boundary that cuts through the middle of one is a well-documented source of the exact
          coupling microservices were supposed to remove.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"Your Billing context calls a third-party payment processor's API, which returns objects like GatewayTransactionRecord with fields such as merchantRef, authCode, and avsResult — vocabulary that has nothing to do with Billing's own ubiquitous language of Invoice, Payment, and Refund. Which context mapping pattern fits, and why?"}
        options={[
          "Conformist — just use GatewayTransactionRecord directly throughout Billing's domain logic to avoid writing extra translation code",
          "Anti-Corruption Layer — build a translation layer that converts the gateway's model into Billing's own Payment/Invoice/Refund vocabulary at the boundary, so the gateway's fields never leak past it",
          "Shared Kernel — merge Billing's model with the payment gateway's model so both sides use identical types",
          "Open Host Service — expose Billing's own API as a public protocol for the payment gateway to consume"
        ]}
        correctIndex={1}
        explanation={"An Anti-Corruption Layer is exactly for this situation: a downstream context with no influence over an upstream system (especially a third-party one) builds an isolating translation layer so the upstream's model can't contaminate its own domain. Shared Kernel requires joint control over the shared code with a cooperating team — not available with a vendor's API. Conformist is a valid choice when the downstream domain doesn't care about the mismatch, but here the vocabularies are genuinely different and the mismatch matters, which is the ACL's exact use case. Open Host Service describes how an upstream exposes services to others, not how you protect yourself as a consumer of one."}
      />
    </LessonLayout>
  );
}
