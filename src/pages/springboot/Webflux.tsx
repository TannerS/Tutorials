import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';

export default function Webflux() {
  return (
    <LessonLayout
      title="Reactive Programming with WebFlux"
      sectionId="springboot"
      lessonIndex={16}
      prev={{ path: '/springboot/observability', label: 'Observability' }}
      next={{ path: '/springboot/resilience', label: 'Resilience4j & Circuit Breakers' }}
    >
      <p>
        Every controller in this section so far has been Spring MVC: <code>@RestController</code>,
        blocking JPA repositories, a servlet thread that sits still until the response is ready to
        write. That is not an oversight — it is still the default for most Spring Boot services, and
        for a lot of them it is the <em>correct</em> default. WebFlux is Spring&apos;s other web
        stack, built on Project Reactor instead of the Servlet API, and it exists to solve one
        specific problem: what happens to a thread-per-request server when &quot;the request&quot;
        spends most of its time waiting on something slow.
      </p>

      <p>
        This lesson also does something the rest of the section hasn&apos;t needed to: compare
        WebFlux honestly against virtual threads, which have been solving a large slice of this exact
        problem since Java 21 without asking you to leave Spring MVC. If you have not read the{' '}
        <strong>Concurrency &amp; Threads</strong> lesson in the Java section, the short version is
        there — virtual threads let ordinary blocking code scale the way reactive code always
        promised to, and that changes when WebFlux is actually worth its cost.
      </p>

      <h2>The Problem, Precisely</h2>

      <p>
        A Spring MVC application built on the default embedded Tomcat runs on a bounded pool of
        platform threads (100&ndash;200 by default). Every incoming request is handed a thread from
        that pool, and the thread is <strong>occupied for the entire request</strong> — including
        every millisecond it spends blocked waiting on a database round trip, a downstream HTTP call,
        or a slow disk read. The thread is not doing anything productive during that wait; it is
        simply parked, holding its stack and its slot in the pool, unavailable to serve any other
        request.
      </p>

      <p>
        Under low concurrency this is invisible. Under high concurrency with slow I/O — the exact
        combination a lot of real backends see — it stops being invisible: once every thread in the
        pool is blocked on some downstream call, the 201st request has nothing to run on and queues,
        no matter how idle your CPU actually is. You are not out of compute. You are out of{' '}
        <em>threads</em>, which is a completely different resource with a completely different fix.
      </p>

      <p>
        WebFlux, running on Netty by default, takes the opposite approach: a small, fixed number of
        event-loop threads (typically one per CPU core) and a hard rule that{' '}
        <strong>no thread is ever allowed to block waiting on I/O</strong>. A request&apos;s work is
        decomposed into a chain of non-blocking stages — issue the DB query, register a callback,
        return the thread to the event loop immediately. When the database responds, whichever
        event-loop thread is free at that moment runs the next stage. The same handful of threads
        weaves between thousands of in-flight requests because none of them ever sits still.
      </p>

      <FlowChart
        title="Thread-per-request (Tomcat / Spring MVC) vs. event-loop (Netty / WebFlux)"
        chart={"graph TD\n  subgraph Thread-per-request - Spring MVC on Tomcat\n    A1[Request 1] --> T1[Thread 1 - BLOCKED waiting on DB]\n    A2[Request 2] --> T2[Thread 2 - BLOCKED waiting on downstream API]\n    A3[Request 200] --> T3[Thread 200 - BLOCKED waiting on DB]\n    A4[Request 201] --> T4[No thread free - QUEUED]\n  end\n  subgraph Event-loop - Spring WebFlux on Netty\n    B1[Request 1] --> EL[4-8 event-loop threads]\n    B2[Request 2] --> EL\n    B3[Request 10000] --> EL\n    EL --> CB[DB driver registers a callback - thread returns to EL immediately]\n    CB -->|response arrives, any free EL thread resumes it| EL\n  end"}
      />

      <InfoBox variant="tip" title="This is the same problem virtual threads solve">
        <p>
          Read that diagram again and notice what the left side is actually complaining about: a
          thread is expensive to hold, so holding one for the duration of a blocking call doesn&apos;t
          scale. Virtual threads attack that premise directly — they make the thread itself
          effectively free, so &quot;one thread blocked per request&quot; stops being a scaling
          problem without changing a single line of your blocking code. WebFlux attacks it from the
          other direction — it never blocks a thread at all. Both are legitimate answers to the same
          question. The trade-off section near the end of this lesson is about choosing between them.
        </p>
      </InfoBox>

      <h2><code>Mono&lt;T&gt;</code> and <code>Flux&lt;T&gt;</code></h2>

      <p>
        Reactor, the library WebFlux is built on, gives you exactly two publisher types.{' '}
        <code>Mono&lt;T&gt;</code> represents <strong>zero or one</strong> asynchronous value —
        the reactive equivalent of a single DB lookup or a single downstream HTTP call.{' '}
        <code>Flux&lt;T&gt;</code> represents <strong>zero to N</strong> asynchronous values — a
        stream, the reactive equivalent of a list query, a paginated feed, or a live sequence of
        events.
      </p>

      <CodeBlock language="java" title="The two shapes">
{`Mono<User> user   = userRepository.findById(id);          // 0 or 1 User
Flux<Order> orders = orderRepository.findByUserId(id);     // 0..N Order, streamed

// Compare to the blocking JPA equivalents you've used everywhere else
// in this section:
Optional<User> user = userRepository.findById(id);         // 0 or 1, but BLOCKS
List<Order> orders   = orderRepository.findByUserId(id);   // 0..N, but BLOCKS`}
      </CodeBlock>

      <h3>Nothing happens until you subscribe</h3>

      <p>
        This is the single most common beginner mistake with Reactor, and it trips up people who
        are otherwise strong engineers, because everything about Java trains you to expect the
        opposite. A <code>Mono</code> or <code>Flux</code> is not a running computation and not a
        container holding a value that&apos;s already on its way — it is a{' '}
        <strong>lazy, declarative description</strong> of a pipeline. Calling <code>.map()</code>,{' '}
        <code>.flatMap()</code>, or any other operator does not run anything; it just appends another
        stage to the description. The described work only actually executes once something{' '}
        <strong>subscribes</strong> to it — and until that happens, the pipeline is inert, no matter
        how long ago you &quot;built&quot; it.
      </p>

      <p>
        Don&apos;t take that on faith. Here is a <code>Mono</code> whose <code>.map()</code> contains
        a side effect (a <code>println</code>), built and then left alone for a full second before
        anything subscribes to it — compiled against real <code>reactor-core</code> 3.7.19 and run on
        JDK 26:
      </p>

      <CodeBlock language="java" title="LazinessDemo.java — compiled with reactor-core 3.7.19, run on JDK 26">
{`import reactor.core.publisher.Mono;

public class LazinessDemo {
    public static void main(String[] args) {
        System.out.println("1. Building the Mono chain...");

        Mono<String> pipeline = Mono.just("hello")
                .map(s -> {
                    System.out.println("   >>> .map() running — this line proves execution happened");
                    return s.toUpperCase();
                });

        System.out.println("2. Mono built. Nothing above should have printed '>>> .map() running' yet.");
        System.out.println("3. Sleeping 1 second so the absence of output is obviously not a timing fluke...");
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println("4. Now calling .subscribe()...");
        pipeline.subscribe(result -> System.out.println("5. Subscriber received: " + result));

        System.out.println("6. Done.");
    }
}

// ACTUAL OUTPUT (paste from the real run, unedited):
//
// 1. Building the Mono chain...
// 2. Mono built. Nothing above should have printed '>>> .map() running' yet.
// 3. Sleeping 1 second so the absence of output is obviously not a timing fluke...
// 4. Now calling .subscribe()...
//    >>> .map() running — this line proves execution happened
// 5. Subscriber received: HELLO
// 6. Done.`}
      </CodeBlock>

      <p>
        Line 3 finished a full second before line 4, and <code>.map()</code>&apos;s side effect still
        did not print until <code>.subscribe()</code> was called on line 4 — despite the{' '}
        <code>Mono</code> chain having been fully built and sitting in the <code>pipeline</code>{' '}
        variable since line 1. Building the pipeline did work you can see: it printed lines 1 and 2.
        What it did <em>not</em> do is run the pipeline itself.
      </p>

      <InfoBox variant="warning" title="Where the implicit subscribe() actually happens">
        <p>
          You will rarely call <code>.subscribe()</code> yourself in a Spring WebFlux controller.
          When a handler method returns a <code>Mono&lt;T&gt;</code> or <code>Flux&lt;T&gt;</code>,{' '}
          <strong>Spring&apos;s WebFlux runtime subscribes to it for you</strong> once it starts
          writing the HTTP response. That is the missing piece behind the classic confused-beginner
          bug report — &quot;I built a <code>Mono</code> chain with logging in it and nothing ever
          printed&quot; — the chain was built but never subscribed to, because it was assigned to a
          local variable and never returned, never chained onto something that was subscribed, and
          never explicitly subscribed by hand. No subscriber, no execution. Ever.
        </p>
      </InfoBox>

      <h2>A Real Reactive Controller — and R2DBC</h2>

      <p>
        A WebFlux controller looks almost identical to the MVC controllers earlier in this section —
        same annotations, same request-mapping vocabulary — except the return types are{' '}
        <code>Mono</code>/<code>Flux</code> instead of the DTO or <code>ResponseEntity&lt;T&gt;</code>{' '}
        directly. This is written for Spring Boot 4.1.1 — the version pinned throughout this
        section (<code>spring-boot-starter-webflux</code>{' '}
        + <code>spring-boot-starter-data-r2dbc</code>):
      </p>

      <CodeBlock language="java" title="ProductController.java — verified against a live WebFlux server">
{`@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    // GET /api/products/{id}
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Product>> get(@PathVariable Long id) {
        return products.findById(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    // GET /api/products?maxPrice=50 — a Flux is a *stream* of 0..N values,
    // not a List built up in memory before it's returned.
    @GetMapping
    public Flux<Product> list(@RequestParam(defaultValue = "999999") double maxPrice) {
        return products.findByPriceLessThan(maxPrice);
    }

    // POST /api/products
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Product> create(@RequestBody Product product) {
        return products.save(product);
    }
}`}
      </CodeBlock>

      <p>
        Nothing here calls <code>.block()</code> or <code>.subscribe()</code> — the framework does
        that. The repository behind it is <strong>R2DBC</strong>, and this is where precision matters
        more than anywhere else in this lesson.
      </p>

      <CodeBlock language="java" title="R2DBC — a reactive repository, not JPA">
{`@Table("product")
public record Product(@Id Long id, String name, double price) { }

public interface ProductRepository extends ReactiveCrudRepository<Product, Long> {
    Flux<Product> findByPriceLessThan(double price);
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="R2DBC is a separate driver spec — it is not 'JPA but async', and JPA does not become non-blocking under WebFlux">
        <p>
          <strong>R2DBC (Reactive Relational Database Connectivity)</strong> is an entirely different
          specification from JDBC, with its own non-blocking driver implementations per database.
          Spring Data R2DBC — used above — is a thin, non-blocking mapping layer over it, and it is
          intentionally simpler than JPA/Hibernate: no lazy loading, no persistence context, no
          first-level cache, no dirty checking. You get an explicit <code>save()</code> that returns a{' '}
          <code>Mono</code>, not an ORM.
        </p>
        <p>
          This matters because of the single most common — and most damaging — mistake made when
          adopting WebFlux: reaching for the JPA repository you already know instead of R2DBC.{' '}
          <strong>
            Spring Data JPA and Hibernate are fundamentally blocking. Nothing about running under
            WebFlux changes that.
          </strong>{' '}
          A <code>JpaRepository.findById()</code> call still blocks the calling thread on a JDBC
          socket read until the database responds — and if that call happens inside a WebFlux
          handler, it blocks one of your <em>four to eight event-loop threads</em>, not one of
          Tomcat&apos;s couple hundred. A handful of slow JPA calls under load is enough to stall{' '}
          <strong>the entire server</strong>, because there is no larger pool to fall back on. This is
          not a theoretical footgun; it is the most frequently reported real-world WebFlux production
          incident, and it re-introduces the exact thread-starvation problem WebFlux exists to avoid
          — just with a much smaller, much more fragile thread budget.
        </p>
        <p>
          The rule: if you are on WebFlux, your database driver, your HTTP clients, your caching
          layer, and every other I/O touchpoint need to be reactive/non-blocking end to end — R2DBC
          (or a reactive Mongo/Redis driver), <code>WebClient</code>, reactive Kafka bindings. One
          blocking call anywhere in that chain reintroduces the original problem inside the one
          runtime that has the least slack to absorb it.
        </p>
      </InfoBox>

      <h2>WebClient — the Reactive HTTP Client</h2>

      <p>
        <code>WebClient</code> is Spring&apos;s non-blocking HTTP client, built to compose naturally
        with <code>Mono</code>/<code>Flux</code> chains. Every call you make with it returns a{' '}
        <code>Mono</code> or <code>Flux</code> — meaning, per the laziness rule above, nothing goes
        over the wire until something subscribes to the result. This compiles and runs against the
        live WebFlux server from the previous example:
      </p>

      <CodeBlock language="java" title="PriceClient.java — verified with real HTTP calls against a running WebFlux+R2DBC server">
{`public class PriceClient {

    private final WebClient client;

    public PriceClient(String baseUrl) {
        this.client = WebClient.builder().baseUrl(baseUrl).build();
    }

    public Mono<Product> getProduct(long id) {
        return client.get()
                .uri("/api/products/{id}", id)
                .retrieve()
                .bodyToMono(Product.class)
                .timeout(Duration.ofSeconds(3))
                .onErrorResume(e -> Mono.empty());
    }

    public Flux<Product> listUnder(double maxPrice) {
        return client.get()
                .uri(uriBuilder -> uriBuilder.path("/api/products")
                        .queryParam("maxPrice", maxPrice)
                        .build())
                .retrieve()
                .bodyToFlux(Product.class);
    }
}

// Actual result of client.listUnder(100.0).collectList().block(), called against
// the ProductController + R2DBC/H2 setup above running on real Netty, port 8085:
//
//   WebClient saw under $100 over real HTTP:
//   [Product[id=1, name=Keyboard, price=45.0], Product[id=3, name=Mouse, price=20.0]]`}
      </CodeBlock>

      <InfoBox variant="note" title="RestTemplate's actual status, verified against the current javadoc and Spring's own blog">
        <p>
          <code>RestTemplate</code>&apos;s javadoc carried the literal phrase &quot;in maintenance
          mode&quot; starting with Spring Framework 5.0. As of Spring Framework 6.1 that wording was
          softened — the current javadoc instead points you to <code>RestClient</code> (the modern{' '}
          <em>synchronous</em> replacement, fluent like <code>WebClient</code> but blocking) for new
          code, and to <code>WebClient</code> for reactive/streaming use. Spring&apos;s own engineering
          blog announced in the Spring Framework 7.0 timeframe an explicit <strong>intent</strong> to
          deprecate <code>RestTemplate</code>, with a formal <code>@Deprecated</code> planned for
          Spring Framework 7.1 and removal targeted for 8.0 — with OSS support continuing for
          several years after that under Spring&apos;s support policy. So: not yet marked{' '}
          <code>@Deprecated</code> in code as of this writing, but unambiguously on its way out, and
          the team has been steering people off it for years already. Practical takeaway, matching
          the REST APIs lesson earlier in this section: don&apos;t write new code against{' '}
          <code>RestTemplate</code>. Use <code>RestClient</code> for blocking code, <code>WebClient</code>{' '}
          when you&apos;re already reactive.
        </p>
      </InfoBox>

      <h2>The Honest Trade-off: WebFlux vs. Virtual Threads</h2>

      <p>
        Both of these exist to answer the same question — <em>how do I serve high I/O-bound
        concurrency without running out of threads?</em> — and since Java 21 you genuinely get to
        choose. Being straight about the trade-off matters more here than almost anywhere else in
        this course, because a lot of WebFlux advocacy predates virtual threads and hasn&apos;t
        caught up.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Dimension</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>WebFlux</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Virtual threads (Spring MVC)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Code style</td>
            <td style={{ padding: '0.75rem' }}>Declarative pipelines — <code>Mono</code>/<code>Flux</code> operator chains</td>
            <td style={{ padding: '0.75rem' }}>Ordinary blocking code — the JPA/RestTemplate style you already know</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Learning curve</td>
            <td style={{ padding: '0.75rem' }}>Steep — a new operator vocabulary, laziness, backpressure, error signaling</td>
            <td style={{ padding: '0.75rem' }}>Near zero — same code, different <code>Thread</code> under the hood</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Debuggability</td>
            <td style={{ padding: '0.75rem' }}>Stack traces span reactive operator internals, notoriously hard to read</td>
            <td style={{ padding: '0.75rem' }}>Ordinary stack traces — a debugger just works</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Stack requirement</td>
            <td style={{ padding: '0.75rem' }}>Every I/O touchpoint must be reactive end to end, or the benefit breaks (see the R2DBC warning above)</td>
            <td style={{ padding: '0.75rem' }}>None — blocking JPA, blocking HTTP clients, JDBC all work unmodified</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Backpressure</td>
            <td style={{ padding: '0.75rem' }}>Built in — a slow consumer can signal a fast producer to slow down</td>
            <td style={{ padding: '0.75rem' }}>None — a fast producer will happily overrun a slow consumer</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Per-connection cost</td>
            <td style={{ padding: '0.75rem' }}>Extremely low — no thread stack per connection at all</td>
            <td style={{ padding: '0.75rem' }}>Low, but not zero — each blocked vthread still holds a stack (starts small, grows on demand)</td>
          </tr>
        </tbody>
      </table>

      <p>
        Take a real position rather than hedge: for a <strong>typical CRUD-heavy Spring Boot service</strong>{' '}
        — REST endpoints backed by a relational database, a few downstream HTTP calls per request,
        concurrency in the thousands rather than the hundreds-of-thousands — virtual threads on Spring
        MVC are now the better default. You get the scaling property WebFlux was invented for, on the
        programming model, debugger, and library ecosystem you already have, with none of the
        &quot;everything must be reactive or the benefit silently disappears&quot; constraint. That is
        a strictly better trade for the majority of Spring Boot applications built today, and it is
        why this section teaches Spring MVC + virtual threads as the default and WebFlux as the
        specialist tool.
      </p>

      <p>
        WebFlux still earns its complexity in cases virtual threads don&apos;t address, because the
        underlying problem is different from thread exhaustion:
      </p>

      <ul>
        <li>
          <strong>Genuine backpressure requirements</strong> — a slow downstream consumer (a websocket
          client on a bad connection, a batch export streaming to a client that reads slowly) needs to
          be able to tell the producer to slow down. Virtual threads give you cheap threads; they give
          you no flow-control primitive at all. If unbounded production speed against a slow consumer
          is a real risk in your system, that is Reactor&apos;s actual differentiator, not thread cost.
        </li>
        <li>
          <strong>Extreme connection concurrency</strong> — gateways, proxies, and fan-out services
          holding hundreds of thousands of simultaneous long-lived connections (SSE broadcast, a
          reverse proxy) where even a virtual thread&apos;s small per-connection stack adds up at that
          scale, and the event-loop model&apos;s near-zero per-connection footprint wins outright.
        </li>
        <li>
          <strong>You're already gluing reactive systems together</strong> — reactive Kafka bindings,
          another team&apos;s WebFlux service, R2DBC already in place. Staying reactive avoids
          constant blocking/non-blocking adapter code at every boundary.
        </li>
      </ul>

      <InfoBox variant="success" title="The practical rule of thumb">
        <p>
          Default to Spring MVC + virtual threads (Java 21+, <code>spring.threads.virtual.enabled=true</code>{' '}
          — see the <strong>Boot 4 Novelties</strong> lesson) for new Spring Boot services. Reach for
          WebFlux specifically when you can name a concrete backpressure requirement or a connection
          count that platform/virtual threads genuinely can&apos;t absorb — not because &quot;reactive
          is more modern.&quot; It isn&apos;t more modern anymore; it&apos;s a specialist tool for a
          narrower problem than it used to be the only answer to.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
