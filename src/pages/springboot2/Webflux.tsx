import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Webflux() {
  return (
    <LessonLayout
      title="Reactive Programming with WebFlux"
      sectionId="springboot2"
      lessonIndex={12}
      prev={{ path: '/springboot2/aop', label: 'AOP & Interceptors' }}
      next={{ path: '/springboot2/resilience', label: 'Resilience4j & Circuit Breakers' }}
    >
      <p>
        Every other lesson in this section is about something that <em>changed</em> — a package
        that got renamed, a class that got deleted, a property that moved. This one is different.
        WebFlux is not a Boot 3/4 feature that Boot 2 lacks: it shipped <strong>in</strong> Spring
        Boot 2.0, alongside Spring Framework 5.0, back in March 2018. A Boot 2.7 codebase can be
        every bit as reactive as a Boot 4 one. The reason this still earns its own lesson is that
        the library versions underneath it are genuinely different, one comparison people reach
        for when justifying WebFlux — virtual threads — <strong>has no first-class support
        yet</strong> on a Boot 2 codebase, and the R2DBC layer holds a small, satisfying surprise
        for anyone who just finished the <a href="/springboot2/javax">javax lesson</a>.
      </p>

      <InfoBox variant="info" title="What this lesson does and does not repeat">
        <p>
          The reactive programming model itself — <code>Mono</code>/<code>Flux</code>, the
          laziness rule, backpressure, why <code>WebClient</code> exists — is identical on Boot 2
          and Boot 4. Nothing about the core contract changed, and this lesson proves that rather
          than asserting it. What follows is written to stand on its own, verified against the
          real <code>2.7.18</code> dependency set rather than assumed from the{' '}
          <a href="/springboot/webflux">Boot 4 WebFlux lesson</a>. Read that one too if you want
          the fuller virtual-threads trade-off discussion — this page&apos;s version of it is
          shorter, because half of that trade-off literally isn&apos;t available yet.
        </p>
      </InfoBox>

      <h2>The Problem, Precisely</h2>

      <p>
        A Spring MVC application on the default embedded Tomcat runs on a bounded pool of platform
        threads (100&ndash;200 by default, unchanged across every Boot version this site covers).
        Every incoming request is handed a thread from that pool, and the thread is{' '}
        <strong>occupied for the entire request</strong> — including every millisecond spent
        blocked on a database round trip or a downstream HTTP call. Under high concurrency with
        slow I/O, once every thread is blocked on some downstream call, the 201st request has
        nothing to run on and queues, no matter how idle the CPU actually is.
      </p>

      <p>
        WebFlux, running on Netty by default, takes the opposite approach: a small, fixed number
        of event-loop threads and a hard rule that <strong>no thread is ever allowed to block
        waiting on I/O.</strong> A request&apos;s work is decomposed into a chain of non-blocking
        stages — issue the query, register a callback, return the thread to the event loop
        immediately. The same handful of threads weaves between thousands of in-flight requests
        because none of them ever sits still.
      </p>

      <FlowChart
        title="Thread-per-request (Tomcat / Spring MVC) vs. event-loop (Netty / WebFlux) — same on Boot 2 as on Boot 4"
        chart={"graph TD\n  subgraph Thread-per-request - Spring MVC on Tomcat\n    A1[Request 1] --> T1[Thread 1 - BLOCKED waiting on DB]\n    A2[Request 2] --> T2[Thread 2 - BLOCKED waiting on downstream API]\n    A3[Request 200] --> T3[Thread 200 - BLOCKED waiting on DB]\n    A4[Request 201] --> T4[No thread free - QUEUED]\n  end\n  subgraph Event-loop - Spring WebFlux on Netty\n    B1[Request 1] --> EL[4-8 event-loop threads]\n    B2[Request 2] --> EL\n    B3[Request 10000] --> EL\n    EL --> CB[DB driver registers a callback - thread returns to EL immediately]\n    CB -->|response arrives, any free EL thread resumes it| EL\n  end"}
      />

      <InfoBox variant="danger" title="The one-line trade-off this lesson can't offer you: virtual threads">
        <p>
          On Boot 4, the honest answer to &quot;how do I avoid thread exhaustion under slow
          I/O?&quot; is usually <em>virtual threads on ordinary Spring MVC</em>, not WebFlux — Java
          21&apos;s Project Loom makes a blocked thread nearly free, so the left side of the
          diagram above stops being a scaling problem without touching a line of code. That{' '}
          <em>one-line</em> version of the option is not on the table here. Confirmed by reading
          Boot 2.7.18&apos;s own configuration metadata, the same way the properties lessons in
          this section check for a moved or removed property:
        </p>
        <CodeBlock language="bash" title="Does spring.threads.virtual.enabled exist in 2.7.18?">
{`unzip -p spring-boot-autoconfigure-2.7.18.jar \\
  META-INF/spring-configuration-metadata.json \\
  | jq '.properties[] | select(.name == "spring.threads.virtual.enabled")'
# (no output — the property is not bound at all)

unzip -p spring-boot-autoconfigure-4.1.1.jar \\
  META-INF/spring-configuration-metadata.json \\
  | jq '.properties[] | select(.name == "spring.threads.virtual.enabled")'`}
        </CodeBlock>
        <CodeBlock language="json" title="Real output — present only on Boot 4.1.1">
{`{
  "name": "spring.threads.virtual.enabled",
  "type": "java.lang.Boolean",
  "description": "Whether to use virtual threads.",
  "defaultValue": false
}`}
        </CodeBlock>
        <p>
          That flag arrived in Boot 3.2 — Boot 2.7 predates it, full stop. But it&apos;s worth
          being precise about <em>why</em> rather than assuming &quot;too old&quot;: Spring&apos;s
          own docs for this exact patch state the requirement plainly, and it is more permissive
          than you&apos;d guess:
        </p>
        <CodeBlock language="text" title="Verbatim from docs.spring.io/spring-boot/docs/2.7.18/reference/html/getting-started.html">
{`Spring Boot 2.7.18 requires Java 8 and is compatible up to and including Java 21.`}
        </CodeBlock>
        <p>
          Java 21 is the release that made virtual threads stable — so a Boot 2.7.18 app running on
          a real JDK 21 is a genuinely supported combination, not a science project. What&apos;s
          missing is only the one-line convenience: no{' '}
          <code>spring.threads.virtual.enabled</code> property to flip, because Boot never shipped
          the autoconfiguration that reads it on this line. Getting Tomcat itself to hand out
          virtual threads on Boot 2.7 means wiring a <code>TomcatConnectorCustomizer</code> bean by
          hand that swaps the connector&apos;s executor for one built from{' '}
          <code>Executors.newVirtualThreadPerTaskExecutor()</code> — a known community pattern from
          before Boot 3.2 existed, not something this page stood up and verified end to end, so
          treat it as a documented starting point rather than copy-paste-verified code. It is
          meaningfully more plumbing than a boolean property, and if you&apos;re already touching
          that much infrastructure it&apos;s worth asking whether you&apos;re closer to just doing
          the <a href="/springboot2/migration">Boot 3.2+ migration</a> properly. On a real Boot 2
          codebase under thread-exhaustion pressure today, the two levers with the least ceremony
          are still the ones this lesson covers: WebFlux, or scaling the Tomcat thread pool and the
          box underneath it further than you&apos;d like to.
        </p>
      </InfoBox>

      <h2>What Actually Ships With 2.7.18</h2>

      <p>
        &quot;WebFlux is WebFlux&quot; undersells it slightly — the exact <code>reactor-core</code>{' '}
        and Reactor Netty versions underneath are pinned by Boot&apos;s BOM, same as Hibernate was
        in the <a href="/springboot2/data">data lesson</a>, and they move a full major reactor-bom
        generation between 2.7 and today. Verified with the same two-hop technique: read Boot&apos;s
        declared <code>reactor-bom.version</code>, then read that BOM for the actual{' '}
        <code>reactor-core</code> version it pins.
      </p>

      <CodeBlock language="bash" title="The two-hop check">
{`for boot in 2.7.18 3.0.13 4.1.1; do
  rb=$(curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot-dependencies/$boot/spring-boot-dependencies-$boot.pom \\
       | grep -oE '<reactor-bom.version>[^<]+' | sed 's/<[^>]*>//')
  rc=$(curl -s https://repo1.maven.org/maven2/io/projectreactor/reactor-bom/$rb/reactor-bom-$rb.pom \\
       | grep -A1 '<artifactId>reactor-core</artifactId>' | grep -oE '<version>[^<]+' | sed 's/<[^>]*>//')
  fw=$(curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot-dependencies/$boot/spring-boot-dependencies-$boot.pom \\
       | grep -oE '<spring-framework.version>[^<]+' | sed 's/<[^>]*>//')
  printf '  boot %-8s -> framework %-8s -> reactor-bom %-10s -> reactor-core %s\\n' "$boot" "$fw" "$rb" "$rc"
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`  boot 2.7.18   -> framework 5.3.31   -> reactor-bom 2020.0.38  -> reactor-core 3.4.34
  boot 3.0.13   -> framework 6.0.14   -> reactor-bom 2022.0.13  -> reactor-core 3.5.12
  boot 4.1.1    -> framework 7.0.9    -> reactor-bom 2025.0.7   -> reactor-core 3.8.7`}
      </CodeBlock>

      <p>
        Three full reactor-bom generations separate 2.7.18 from 4.1.1. The good news, and it is
        worth saying plainly rather than burying it: <strong>the operator vocabulary this lesson
        teaches — <code>map</code>, <code>flatMap</code>, <code>subscribe</code>,{' '}
        <code>Mono</code>/<code>Flux</code> themselves — has been stable across every one of those
        generations.</strong> This is a library that treats its public API as a genuine contract.
        What moves between these versions is internals, performance, and the occasional new
        operator — not the fundamentals below.
      </p>

      <p>R2DBC tells a slightly different, and slightly more interesting, version story:</p>

      <CodeBlock language="bash" title="Does Boot's BOM import a named r2dbc-bom release train?">
{`for boot in 2.7.18 3.0.13 4.1.1; do
  out=$(curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot-dependencies/$boot/spring-boot-dependencies-$boot.pom \\
       | grep -oE '<r2dbc-bom.version>[^<]+')
  [ -z "$out" ] && out="(no r2dbc-bom import - driver versions managed directly)"
  printf '  boot %-8s : %s\\n' "$boot" "$out"
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`  boot 2.7.18   : <r2dbc-bom.version>Borca-SR2
  boot 3.0.13   : (no r2dbc-bom import - driver versions managed directly)
  boot 4.1.1    : (no r2dbc-bom import - driver versions managed directly)`}
      </CodeBlock>

      <p>
        2.7.18 is the only one of the three that pulls R2DBC in via a separately-versioned,
        codenamed BOM (<code>Borca-SR2</code>, itself resolving to <code>r2dbc-spi 0.9.1.RELEASE</code>{' '}
        and <code>r2dbc-h2 0.9.1.RELEASE</code>). Boot 3.0 onward folded the individual driver
        versions (<code>r2dbc-spi</code>, <code>r2dbc-h2</code>, <code>r2dbc-postgresql</code>,
        &hellip;) directly into <code>spring-boot-dependencies</code> as ordinary properties — a
        small housekeeping change, not a functional one, but it means the exact bash incantation
        for &quot;what R2DBC am I on&quot; genuinely differs between a Boot 2 and a Boot 3+
        codebase.
      </p>

      <CodeBlock language="xml" title="pom.xml — nothing here needs an explicit version; the parent BOM pins it all">
{`<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-r2dbc</artifactId>
</dependency>
<dependency>
    <groupId>io.r2dbc</groupId>
    <artifactId>r2dbc-h2</artifactId>
    <scope>runtime</scope>
</dependency>`}
      </CodeBlock>

      <InfoBox variant="tip" title="A quiet consequence of the version gap: WebFlux never touches javax.servlet">
        <p>
          <code>spring-boot-starter-webflux</code> on the default Netty engine pulls in{' '}
          <code>spring-boot-starter-reactor-netty</code>, <code>spring-web</code>, and{' '}
          <code>spring-webflux</code> — checked directly against the published{' '}
          <code>spring-boot-starter-webflux-2.7.18.pom</code> — and <strong>none of them depend on{' '}
          <code>javax.servlet-api</code> at all.</strong> Netty is not a servlet container, so
          there is no Servlet API in this stack in the first place. If your service is WebFlux on
          Netty end to end, it was already immune to the single biggest cost item in the{' '}
          <a href="/springboot2/javax">javax &rarr; jakarta migration</a> before you ever thought
          about upgrading — there is no <code>HttpServletRequest</code>, no{' '}
          <code>javax.servlet.Filter</code>, nothing for the rename to touch. (The moment you add{' '}
          <code>spring-boot-starter-tomcat</code> back in — some teams do, for WebFlux-on-Servlet
          deployment — that immunity goes away. Netty is the case where it holds.)
        </p>
      </InfoBox>

      <h2><code>Mono&lt;T&gt;</code> and <code>Flux&lt;T&gt;</code></h2>

      <p>
        Reactor gives you exactly two publisher types. <code>Mono&lt;T&gt;</code> represents{' '}
        <strong>zero or one</strong> asynchronous value. <code>Flux&lt;T&gt;</code> represents{' '}
        <strong>zero to N</strong> asynchronous values, streamed rather than collected.
      </p>

      <CodeBlock language="java" title="The two shapes, next to the blocking equivalents this section has used everywhere else">
{`Mono<User> user     = userRepository.findById(id);          // 0 or 1 User
Flux<Order> orders   = orderRepository.findByUserId(id);      // 0..N Order, streamed

Optional<User> user2 = userRepository.findById(id);           // 0 or 1, but BLOCKS
List<Order> orders2  = orderRepository.findByUserId(id);      // 0..N, but BLOCKS`}
      </CodeBlock>

      <h3>Nothing happens until you subscribe</h3>

      <p>
        A <code>Mono</code> or <code>Flux</code> is a <strong>lazy, declarative description</strong>{' '}
        of a pipeline, not a running computation. Calling <code>.map()</code> just appends another
        stage to the description; nothing executes until something <strong>subscribes</strong>.
        Don&apos;t take that on faith — here it is compiled against the real{' '}
        <code>reactor-core 3.4.34</code> that Boot 2.7.18 actually pins (not a newer jar borrowed
        from convenience), targeting Java 8 bytecode, run on a real JVM:
      </p>

      <CodeBlock language="java" title="LazinessDemo.java — compiled with reactor-core 3.4.34, --release 8, the exact version 2.7.18 ships">
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
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — javac --release 8 -cp reactor-core-3.4.34.jar:reactive-streams-1.0.4.jar">
{`1. Building the Mono chain...
2. Mono built. Nothing above should have printed '>>> .map() running' yet.
3. Sleeping 1 second so the absence of output is obviously not a timing fluke...
4. Now calling .subscribe()...
   >>> .map() running — this line proves execution happened
5. Subscriber received: HELLO
6. Done.`}
      </CodeBlock>

      <p>
        Character-for-character the same behaviour as the Boot 4 version of this demo, run against
        a <code>reactor-core</code> jar three generations older. This is exactly what &quot;the
        API is a stable contract&quot; means in practice, not just as a claim.
      </p>

      <h2>Backpressure, Concretely</h2>

      <p>
        The trade-off tables in the Boot 4 lesson mention backpressure as a bullet point; it is
        worth actually seeing it happen once. A <code>Flux</code> subscriber does not have to ask
        for everything at once — it can request a bounded number of items, process them, and only
        then ask for more, and the publisher is contractually obliged to honour that and never send
        more than what was requested. This is the mechanism that stops a fast producer from
        overrunning a slow consumer, and it has no equivalent at all in blocking Java (a{' '}
        <code>List</code> is either fully in memory or it isn&apos;t; there is no &quot;send me two
        more when I&apos;m ready&quot;).
      </p>

      <CodeBlock language="java" title="BackpressureDemo.java — a subscriber that only ever asks for 2 at a time">
{`import org.reactivestreams.Subscription;
import reactor.core.publisher.BaseSubscriber;
import reactor.core.publisher.Flux;

public class BackpressureDemo {
    public static void main(String[] args) {
        Flux<Integer> source = Flux.range(1, 10)
                .doOnRequest(n -> System.out.println("   <<< upstream got a request for " + n + " item(s)"));

        source.subscribe(new BaseSubscriber<Integer>() {
            @Override
            protected void hookOnSubscribe(Subscription subscription) {
                System.out.println("1. Subscriber asking for 2 at a time (not unbounded)");
                request(2);
            }

            @Override
            protected void hookOnNext(Integer value) {
                System.out.println("2. Received: " + value);
                if (value % 2 == 0) {
                    System.out.println("   -- consumer 'processed' a pair, asking for 2 more --");
                    request(2);
                }
            }

            @Override
            protected void hookOnComplete() {
                System.out.println("3. Done - upstream never sent more than 2 unacknowledged items");
            }
        });
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — same reactor-core 3.4.34, same classpath as the laziness demo">
{`1. Subscriber asking for 2 at a time (not unbounded)
   <<< upstream got a request for 2 item(s)
2. Received: 1
2. Received: 2
   -- consumer 'processed' a pair, asking for 2 more --
   <<< upstream got a request for 2 item(s)
2. Received: 3
2. Received: 4
   -- consumer 'processed' a pair, asking for 2 more --
   <<< upstream got a request for 2 item(s)
2. Received: 5
2. Received: 6
   -- consumer 'processed' a pair, asking for 2 more --
   <<< upstream got a request for 2 item(s)
2. Received: 7
2. Received: 8
   -- consumer 'processed' a pair, asking for 2 more --
   <<< upstream got a request for 2 item(s)
2. Received: 9
2. Received: 10
   -- consumer 'processed' a pair, asking for 2 more --
   <<< upstream got a request for 2 item(s)
3. Done - upstream never sent more than 2 unacknowledged items`}
      </CodeBlock>

      <p>
        The source has 10 items ready to go instantly (<code>Flux.range</code> holds nothing back),
        yet <code>doOnRequest</code> only ever fires with &quot;2&quot; — never once with
        &quot;10&quot; or &quot;unbounded&quot;. The subscriber is genuinely controlling the pace.
        In a WebFlux controller you almost never call <code>request()</code> by hand — the HTTP
        response writer does this for you, requesting more of your <code>Flux</code> only as fast
        as the client&apos;s TCP connection can actually absorb bytes, which is precisely how a
        slow client (a mobile connection, a client that stopped reading) avoids becoming a memory
        problem on your server.
      </p>

      <FlowChart
        title="Who is allowed to be the bottleneck"
        chart={"graph LR\nP[\"Producer - has 10 items ready NOW\"] -->|\"request(2)\"| S[\"Slow subscriber\"]\nS -->|\"processes 2\"| P\nP -.->|\"WITHOUT backpressure: producer sends all 10 regardless\"| Mem[\"Unbounded buffer growth on the slow side\"]\nstyle Mem fill:#3b1a1a,stroke:#f87171\nstyle S fill:#1a2744,stroke:#5b9cf6"}
      />

      <h2>A Real Reactive Controller — and R2DBC</h2>

      <p>
        Written for, compiled against, and <strong>run live</strong> on Spring Boot 2.7.18 —
        genuinely started with <code>spring-boot-starter-webflux</code> +{' '}
        <code>spring-boot-starter-data-r2dbc</code> + <code>r2dbc-h2</code>, JDK 21, and hit with
        real <code>curl</code> requests rather than described from memory:
      </p>

      <CodeBlock language="java" title="ProductController.java — real Boot 2.7.18 controller">
{`@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<Product>> get(@PathVariable Long id) {
        return products.findById(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping
    public Flux<Product> list(@RequestParam(defaultValue = "999999") double maxPrice) {
        return products.findByPriceLessThan(maxPrice);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Product> create(@RequestBody Product product) {
        return products.save(product);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — curl against the live Boot 2.7.18 process, port 8085">
{`$ curl -s http://localhost:8085/api/products/1
{"id":1,"name":"Keyboard","price":45.0}

$ curl -s "http://localhost:8085/api/products?maxPrice=100"
[{"id":1,"name":"Keyboard","price":45.0},{"id":3,"name":"Mouse","price":20.0}]

$ curl -s -i http://localhost:8085/api/products/999
HTTP/1.1 404 Not Found
content-length: 0

$ curl -s -i -X POST http://localhost:8085/api/products \\
       -H "Content-Type: application/json" -d '{"name":"Webcam","price":60.0}'
HTTP/1.1 201 Created
Content-Type: application/json

{"id":4,"name":"Webcam","price":60.0}`}
      </CodeBlock>

      <p>
        Not one line of that controller differs from what the Boot 4 lesson would show you — same
        imports, same annotations, same return types. The repository behind it is R2DBC, and this
        is where a Boot-2-specific surprise shows up:
      </p>

      <CodeBlock language="java" title="Product.java and ProductRepository.java — the real entity used above">
{`@Table("product")
public class Product {
    @Id
    private Long id;
    private String name;
    private double price;
    // getters/setters omitted
}

public interface ProductRepository extends ReactiveCrudRepository<Product, Long> {
    Flux<Product> findByPriceLessThan(double price);
}`}
      </CodeBlock>

      <InfoBox variant="success" title="R2DBC entities were never part of the javax → jakarta split — on ANY Boot version">
        <p>
          Look closely at the imports: <code>@Table</code> and <code>@Id</code> above come from{' '}
          <code>org.springframework.data.relational.core.mapping</code> and{' '}
          <code>org.springframework.data.annotation</code>. <strong>Not{' '}
          <code>javax.persistence</code>. Not <code>jakarta.persistence</code>.</strong> Spring
          Data R2DBC was built from scratch as a lightweight mapping layer — it is intentionally{' '}
          <em>not</em> JPA, has never depended on the JPA specification, and therefore was never a
          participant in the rename that consumes the whole{' '}
          <a href="/springboot2/javax">javax lesson</a>. If a Boot 2 service is R2DBC end to end
          rather than JPA, its persistence-layer code needs zero annotation changes to run on Boot
          3 or 4 — a genuinely rare thing to be able to say about anything crossing that boundary.
          It still needs the driver coordinate check from the version section above, and it still
          needs whatever the actual Hibernate-flavoured <a href="/springboot2/data">ID generator
          hazards</a> would have applied to a JPA sibling table — but those don&apos;t apply here
          either, because there is no Hibernate in an R2DBC-only service at all.
        </p>
      </InfoBox>

      <h2>WebClient — the Reactive HTTP Client</h2>

      <p>
        <code>WebClient</code> is Spring&apos;s non-blocking HTTP client and has been since Spring
        5.0 — there is no Boot-2-vs-Boot-4 distinction to make here beyond the version numbers
        already covered above. Real output again, this time a second real process making an actual
        HTTP call against the controller above, both running Boot 2.7.18&apos;s exact dependency
        set:
      </p>

      <CodeBlock language="java" title="PriceClientDemo.java — verified with a real HTTP call against the live server above">
{`WebClient client = WebClient.builder().baseUrl("http://localhost:8085").build();

List<Map> result = client.get()
        .uri(uriBuilder -> uriBuilder.path("/api/products").queryParam("maxPrice", 100.0).build())
        .retrieve()
        .bodyToFlux(Map.class)
        .timeout(Duration.ofSeconds(3))
        .collectList()
        .block();

System.out.println("WebClient saw under $100 over real HTTP: " + result);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`WebClient saw under $100 over real HTTP: [{id=1, name=Keyboard, price=45.0}, {id=3, name=Mouse, price=20.0}, {id=4, name=Webcam, price=60.0}]`}
      </CodeBlock>

      <InfoBox variant="danger" title="On Boot 2, RestClient is not an option — it doesn't exist yet">
        <p>
          The Boot 4 lesson steers you toward <code>RestClient</code> for new blocking code and{' '}
          <code>WebClient</code> for reactive code. On a Boot 2.7 codebase, that advice is only
          half available. <code>RestClient</code> arrived in Spring Framework 6.1 — checked
          directly against the published jars:
        </p>
        <CodeBlock language="bash" title="Does org.springframework.web.client.RestClient exist in the class?">
{`unzip -l spring-web-5.3.31.jar | grep -c 'web/client/RestClient.class'   # Boot 2.7.18's Framework
unzip -l spring-web-6.1.14.jar | grep -c 'web/client/RestClient.class'   # Framework 6.1+`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output">
{`0
1`}
        </CodeBlock>
        <p>
          So on Boot 2.7, your two real choices for HTTP calls are <code>WebClient</code>{' '}
          (non-blocking, needs a subscriber, works fine in a plain MVC controller if you{' '}
          <code>.block()</code> it — not ideal, but it works) or <code>RestTemplate</code>. That
          second one carries the exact same javadoc warning it does everywhere else — verified
          straight from the <code>spring-web-5.3.31</code> sources:
        </p>
        <CodeBlock language="java" title="RestTemplate.java javadoc, verbatim, from spring-web-5.3.31-sources.jar">
{`* <p><strong>NOTE:</strong> As of 5.0 this class is in maintenance mode, with
* only minor requests for changes and bugs to be accepted going forward. Please,
* consider using the org.springframework.web.reactive.client.WebClient`}
        </CodeBlock>
        <p>
          It has said that since <em>5.0</em> — which shipped with Boot 2.0 in March 2018. In
          other words: every single Boot 2 codebase you will ever open has been living with that
          warning since the day it was created. That is not a reason to panic about legacy code —
          it is a reason not to be surprised when you see <code>RestTemplate</code> everywhere in
          one, and a reason to reach for <code>WebClient</code> yourself when you add anything new,
          even inside an otherwise fully blocking Boot 2 service.
        </p>
      </InfoBox>

      <h2>The Honest Trade-off, Boot-2-Flavoured</h2>

      <p>
        The Boot 4 lesson frames this as WebFlux vs. virtual threads, with virtual threads winning
        for most ordinary CRUD services because the flag is free. That framing only partly applies
        here — Boot 2.7.18 is verified compatible up to and including Java 21, so virtual threads
        are reachable, just not for free. The real trade-off on a Boot 2.7 codebase weighs
        WebFlux&apos;s real complexity against manual Tomcat-executor plumbing, not against a
        one-line property:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Dimension</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>WebFlux on Boot 2.7</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Stay on Spring MVC (Tomcat)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Fix for thread exhaustion under slow I/O</td>
            <td style={{ padding: '0.75rem' }}>Yes — the same event-loop model Boot 4 gets, works out of the box</td>
            <td style={{ padding: '0.75rem' }}>Possible via a hand-wired virtual-thread executor on JDK 21 (Boot 2.7.18 supports it), but no <code>spring.threads.virtual.enabled</code> shortcut — more plumbing than on Boot 3.2+</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Learning curve, team ramp-up</td>
            <td style={{ padding: '0.75rem' }}>Same steep curve as always — operator vocabulary, laziness, backpressure</td>
            <td style={{ padding: '0.75rem' }}>None — this is what most Boot 2 teams already know</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Persistence layer</td>
            <td style={{ padding: '0.75rem' }}>Must be R2DBC — Hibernate/JPA is still fully blocking on Boot 2, same as Boot 4</td>
            <td style={{ padding: '0.75rem' }}>Whatever you already have (JPA on Hibernate 5.6, per the data lesson)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Migration cost if you later go to Boot 3/4</td>
            <td style={{ padding: '0.75rem' }}>Low — WebFlux code barely touches javax at all (see the InfoBox above)</td>
            <td style={{ padding: '0.75rem' }}>Standard — same javax/Hibernate/Security migration as any other Boot 2 MVC app</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="success" title="The practical rule of thumb, for a Boot 2 codebase specifically">
        <p>
          If a Boot 2.7 service is genuinely falling over from thread exhaustion under slow
          downstream I/O today, and neither the Boot 3.2+ migration nor the manual
          virtual-thread-executor plumbing above is happening this quarter, WebFlux is a real,
          available, working answer <em>right now</em> — not a consolation prize. It is more work
          than flipping <code>spring.threads.virtual.enabled</code> would be on a newer Boot, but
          that flag simply isn&apos;t a Boot 2 option. Reach for WebFlux here when you can name the
          actual I/O bottleneck; don&apos;t reach for it because a blog post says reactive is more
          modern — that advice was already dated by the time Boot 2.7 shipped, and it&apos;s more
          dated now.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}

export default SpringBoot2Webflux;
