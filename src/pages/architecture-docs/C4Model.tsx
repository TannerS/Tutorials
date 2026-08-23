import LessonLayout from '../../components/LessonLayout';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function ArchitectureDocsC4Model() {
  return (
    <LessonLayout
      title="The C4 Model for Architecture Diagrams"
      sectionId="architecture-docs"
      lessonIndex={1}
      prev={{ path: '/architecture-docs/adrs', label: 'Architecture Decision Records' }}
      next={{ path: '/architecture-docs/nfrs', label: 'Non-Functional Requirements as a Framework' }}
    >
      <p>
        Whiteboard architecture diagrams tend to fail in one of two directions: either everything is
        one giant box labeled &quot;Backend,&quot; or every diagram tries to show the whole system down
        to individual classes at once and becomes unreadable. The <strong>C4 model</strong> fixes this
        by defining a small, fixed set of zoom levels, each with a specific scope and a specific
        audience, so a diagram never has to do more than one job at a time.
      </p>

      <p>
        C4 was created by <strong>Simon Brown</strong>. Per Brown&apos;s own site (c4model.com), the
        model&apos;s roots trace back to roughly 2006&ndash;2009, the four diagram types were named
        &mdash; &quot;context, containers, components, classes&quot; &mdash; in early 2010, and the{' '}
        <strong>&quot;C4&quot;</strong> name itself was first used in early 2011. The fourth level was
        later renamed from &quot;classes&quot; to &quot;code&quot; during 2015&ndash;2016, which is the
        name it goes by today. &quot;C4&quot; is shorthand for the four levels, each of which happens to
        start with C: <strong>Context, Container, Component, Code</strong>.
      </p>

      <InfoBox variant="info" title="The Four Levels, At a Glance">
        <p><strong>1. Context</strong> &mdash; the system as one box, its users, and the other systems it talks to. Zero internal detail.</p>
        <p><strong>2. Container</strong> &mdash; zoom into <em>one</em> system: its major deployable/runnable units (web app, API, database, queue) and how they talk to each other.</p>
        <p><strong>3. Component</strong> &mdash; zoom into <em>one</em> container: its major internal building blocks/modules.</p>
        <p><strong>4. Code</strong> &mdash; zoom into <em>one</em> component: essentially a class diagram. Optional, and rarely worth hand-drawing.</p>
      </InfoBox>

      <h2>Level 1: System Context</h2>

      <p>
        The context diagram shows your system as a single box, surrounded by the people who use it and
        the other systems it depends on or is depended on by. No internal architecture appears at all
        &mdash; the system is a black box on purpose. The audience is anyone, technical or not: this is
        the diagram you show a stakeholder who has never seen the codebase and does not need to.
      </p>

      <h2>Level 2: Container</h2>

      <p>
        Zoom into that single box and you get the container diagram: the major deployable or runnable
        units that make up the system &mdash; a web application, an API service, a mobile app, a
        database, a message broker &mdash; and the protocols they use to communicate. This is the level
        most useful to your own engineering team and to operations/support staff, because it is the
        first diagram that shows actual technology choices.
      </p>

      <InfoBox variant="warning" title='"Container" Does Not Mean Docker Container'>
        <p>
          This is the single most common point of confusion with C4, worth flagging explicitly.
          Brown&apos;s own definition, from c4model.com: <em>&quot;In C4, a container is an application
          or a data store. For example, a server-side web application, a client-side single-page
          application, a desktop application, a mobile app, a database schema, a folder on a file
          system, an Amazon Web Services S3 bucket, etc.&quot;</em> That is a much broader idea than a
          Docker container &mdash; a container in C4 terms is any separately runnable/deployable unit,
          containerized or not. It is also, chronologically, not a Docker reference to begin with: C4&apos;s
          &quot;container&quot; diagram type was named in early 2010, roughly three years before Docker&apos;s
          first public release in March 2013. A React SPA running in a browser is a &quot;container&quot; in
          C4 terms; it obviously has nothing to do with Docker.
        </p>
      </InfoBox>

      <h2>Level 3: Component</h2>

      <p>
        Zoom into <em>one</em> container and you get the component diagram: the major internal building
        blocks inside that container &mdash; the groupings of code behind an interface, roughly
        &quot;modules&quot; or &quot;packages&quot; &mdash; and how they collaborate to fulfill that
        container&apos;s responsibilities. For a Spring Boot API container this is typically the layer
        where you would show something like an <code>OrderController</code>, an{' '}
        <code>OrderService</code>, a <code>PaymentGatewayClient</code>, and an{' '}
        <code>OrderRepository</code>, and how a request flows through them. The audience is
        architects and developers working directly on that container.
      </p>

      <h2>Level 4: Code</h2>

      <p>
        Zoom into one component and, in principle, you get a code diagram &mdash; effectively a UML
        class diagram showing the classes, interfaces, and relationships that implement that component.
        In practice, Brown&apos;s own guidance treats this level as something you mostly should not
        hand-draw. His site is direct about it: the code diagram is <em>&quot;very much an optional
        level of detail,&quot;</em> and under &quot;Recommended?&quot; the answer given is{' '}
        <em>&quot;No, particularly for long-lived documentation because most IDEs can generate this
        level of detail on demand.&quot;</em> The suggested approach, if you need it at all, is to
        generate it from an IDE or UML tool on demand rather than maintain it by hand &mdash; hand-drawn
        class diagrams go stale the moment someone renames a method.
      </p>

      <h2>Worked Example: An Order-Placement System</h2>

      <p>
        The two diagrams below are deliberately built to zoom into the <em>same</em> system, the way
        C4 is meant to be used: the single box in the context diagram is exactly what the container
        diagram opens up.
      </p>

      <FlowChart
        title="Level 1 — System Context Diagram"
        chart={"graph TD\n  Customer[Customer] -->|places orders, browses catalog| System[Ordering System]\n  System -->|charges payment| PaymentGW[Payment Gateway - Stripe]\n  System -->|requests shipping labels| Carrier[Shipping Carrier API]\n  System -->|sends order confirmation email| EmailSvc[Email Delivery Service]\n  style System fill:#1a2744"}
      />

      <p>
        At this level, &quot;Ordering System&quot; is one opaque box. We know it talks to a payment
        gateway, a shipping carrier, and an email service, and that customers use it &mdash; nothing
        about what is running inside it. Now zoom in:
      </p>

      <FlowChart
        title="Level 2 — Container Diagram, Zoomed Into the Ordering System"
        chart={"graph TD\n  Customer[Customer] -->|HTTPS| WebApp[Web Application - React SPA]\n  subgraph Ordering System\n    WebApp -->|JSON over HTTPS| API[Orders API - Spring Boot]\n    API -->|JDBC| DB[(Orders Database - PostgreSQL)]\n    API -->|publishes order events| MQ[Message Queue - Kafka]\n    MQ -->|delivers events| Worker[Notification Worker]\n  end\n  API -->|charges payment| PaymentGW[Payment Gateway - Stripe]\n  API -->|requests shipping labels| Carrier[Shipping Carrier API]\n  Worker -->|sends confirmation email| EmailSvc[Email Delivery Service]\n  style WebApp fill:#1a2744\n  style API fill:#1a2744\n  style DB fill:#1a2744\n  style MQ fill:#1a2744\n  style Worker fill:#1a2744"}
      />

      <p>
        The &quot;Ordering System&quot; box from the context diagram is now the boundary drawn around
        five containers: a React single-page app, a Spring Boot API, a PostgreSQL database, a Kafka
        queue, and a notification worker. Notice that the external relationships from the context
        diagram did not change &mdash; the system still talks to the same payment gateway, carrier, and
        email service &mdash; but this diagram reveals <em>which specific container</em> owns each of
        those relationships. The context diagram said &quot;the system sends confirmation emails&quot;;
        the container diagram shows it is specifically the Notification Worker, reacting to a Kafka
        event published by the API, that actually does it. That is the entire point of zoom levels:
        each one adds detail without invalidating the one above it.
      </p>

      <InfoBox variant="note" title="Mermaid Is Not the Official C4 Notation">
        <p>
          Worth being upfront about this: the diagrams above are drawn with mermaid&apos;s general-purpose{' '}
          <code>graph TD</code> flowchart syntax, because that is the diagramming tool already available
          on this site. That is <strong>not</strong> the notation the C4 model&apos;s own tooling
          ecosystem is built around &mdash; the official/canonical way to produce C4 diagrams is{' '}
          <strong>C4-PlantUML</strong> or <strong>Structurizr</strong> (a tool built by Simon Brown
          himself), both of which understand C4-specific concepts natively &mdash; person shapes,
          container/component boundaries, auto-layout by abstraction level, and consistent styling
          rules enforced by the tool rather than by hand. Plain mermaid flowcharts are a reasonable way
          to represent C4&apos;s <em>conceptual</em> levels (which is all that matters for this lesson),
          but do not mistake them for &quot;the official C4 diagram format&quot; &mdash; they are a
          generic tool being pointed at a specific modeling convention, not an implementation of it.
        </p>
      </InfoBox>

      <h2>Which Level Do I Actually Need</h2>

      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Level</th>
            <th>Audience</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>What does this system do, and what does it talk to?</td>
            <td><strong>Context</strong></td>
            <td>Anyone — stakeholders, new hires, other teams</td>
          </tr>
          <tr>
            <td>What are the major moving pieces, and how do they communicate?</td>
            <td><strong>Container</strong></td>
            <td>Engineers, ops/support staff</td>
          </tr>
          <tr>
            <td>How is this one service internally organized?</td>
            <td><strong>Component</strong></td>
            <td>Developers working on that specific container</td>
          </tr>
          <tr>
            <td>What are the exact classes and their relationships?</td>
            <td><strong>Code</strong> (rarely drawn by hand)</td>
            <td>Rarely needed — generate on demand from an IDE instead</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"A teammate says: \"Our container diagram is wrong — it shows our React app and API as separate containers, but neither one runs in Docker.\" What's the actual issue with this objection?"}
        options={[
          "They're right — a C4 container diagram should only show things that run in Docker containers",
          "\"Container\" in the C4 model means any separately deployable/runnable unit (an app or a data store) — it predates Docker and has nothing to do with it, so the diagram is correct as-is",
          "The diagram should be redrawn as a Component diagram instead",
          "C4 containers only apply to backend services, not frontend applications"
        ]}
        correctIndex={1}
        explanation={"This is the most common point of confusion with C4. Simon Brown's own definition (c4model.com) is that a container is \"an application or a data store\" — a web app, SPA, mobile app, database, file system folder, S3 bucket, etc. The term was named in early 2010, about three years before Docker's first public release in 2013, and simply has no relationship to it. A React SPA and a Spring Boot API are both legitimate containers regardless of how or whether either one is deployed with Docker."}
      />
    </LessonLayout>
  );
}
